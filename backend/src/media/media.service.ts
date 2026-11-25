import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';

// Upload ảnh lên Cloudinary bằng REST (signed upload), không dùng SDK: chỉ cần
// fetch, FormData và Blob có sẵn của Node.
const CLOUDINARY_FOLDER = 'recipe-app/recipes';

export const NOT_CONFIGURED_MESSAGE = 'Chưa cấu hình dịch vụ ảnh';
export const UPLOAD_FAILED_MESSAGE =
  'Không tải được ảnh lên. Vui lòng thử lại.';

// Cloudinary ký bằng SHA-1 của các tham số (trừ file, api_key và resource_type)
// xếp theo thứ tự alphabet, nối với api_secret. Ở đây chỉ có folder và timestamp.
export function buildSignature(
  folder: string,
  timestamp: number,
  apiSecret: string,
): string {
  return createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(private readonly configService: ConfigService) {}

  async uploadImage(file: Express.Multer.File): Promise<{ url: string }> {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    // Thiếu cấu hình là lỗi phía server chứ không phải lỗi của client, và sẽ
    // còn lặp lại cho tới khi deploy lại: 503 chứ không phải 502.
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException(NOT_CONFIGURED_MESSAGE);
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = buildSignature(CLOUDINARY_FOLDER, timestamp, apiSecret);

    const form = new FormData();
    // Buffer của multer là Uint8Array trên ArrayBufferLike; Blob cần
    // ArrayBuffer thật nên sao chép lại (tối đa 5 MB).
    form.append(
      'file',
      new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
      file.originalname,
    );
    form.append('api_key', apiKey);
    form.append('timestamp', String(timestamp));
    form.append('folder', CLOUDINARY_FOLDER);
    form.append('signature', signature);

    const secureUrl = await this.postToCloudinary(cloudName, form);
    return { url: secureUrl };
  }

  // Mọi trục trặc phía Cloudinary (không gọi được, trả lỗi, body không có
  // secure_url) đều quy về 502 với cùng một thông báo cho người dùng; chi tiết
  // chỉ ghi vào log của server.
  private async postToCloudinary(
    cloudName: string,
    form: FormData,
  ): Promise<string> {
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    let response: Response;
    try {
      response = await fetch(endpoint, { method: 'POST', body: form });
    } catch (error) {
      this.logger.error('Không gọi được Cloudinary', error);
      throw new BadGatewayException(UPLOAD_FAILED_MESSAGE);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      this.logger.error(`Cloudinary trả ${response.status}: ${detail}`);
      throw new BadGatewayException(UPLOAD_FAILED_MESSAGE);
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (error) {
      this.logger.error('Cloudinary trả body không phải JSON', error);
      throw new BadGatewayException(UPLOAD_FAILED_MESSAGE);
    }

    const secureUrl = (body as { secure_url?: unknown })?.secure_url;
    if (typeof secureUrl !== 'string' || !secureUrl) {
      this.logger.error('Cloudinary trả body thiếu secure_url');
      throw new BadGatewayException(UPLOAD_FAILED_MESSAGE);
    }

    return secureUrl;
  }
}
