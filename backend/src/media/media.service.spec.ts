import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadGatewayException,
  BadRequestException,
  HttpStatus,
  Logger,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import {
  ALLOWED_IMAGE_TYPES,
  ImageTooLargeFilter,
  imageUploadOptions,
  MAX_IMAGE_BYTES,
  TOO_LARGE_MESSAGE,
  WRONG_TYPE_MESSAGE,
} from './media.controller';
import { MediaService } from './media.service';

// Cấu hình đủ để service gọi được Cloudinary; test "thiếu cấu hình" bỏ bớt key.
const CONFIG = {
  CLOUDINARY_CLOUD_NAME: 'demo-cloud',
  CLOUDINARY_API_KEY: '123456789',
  CLOUDINARY_API_SECRET: 'super-secret',
};

function makeFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'mon-an.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('anh-gia-lap'),
    ...overrides,
  } as Express.Multer.File;
}

// fileFilter của multer trả kết quả qua callback nên gói lại cho dễ assert.
function runFileFilter(mimetype: string): { error: unknown; accepted?: boolean } {
  const result: { error: unknown; accepted?: boolean } = { error: null };
  imageUploadOptions.fileFilter?.(
    {} as never,
    makeFile({ mimetype }),
    (error: unknown, accepted?: boolean) => {
      result.error = error;
      result.accepted = accepted;
    },
  );
  return result;
}

describe('POST /media/images — kiểm tra file trước khi upload', () => {
  it.each(ALLOWED_IMAGE_TYPES)('nhận ảnh %s', (mimetype) => {
    const { error, accepted } = runFileFilter(mimetype);

    expect(error).toBeNull();
    expect(accepted).toBe(true);
  });

  it.each(['application/pdf', 'image/gif', 'text/plain'])(
    'từ chối %s bằng 400 kèm thông báo tiếng Việt',
    (mimetype) => {
      const { error, accepted } = runFileFilter(mimetype);

      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getStatus()).toBe(
        HttpStatus.BAD_REQUEST,
      );
      expect((error as BadRequestException).message).toBe(WRONG_TYPE_MESSAGE);
      expect(accepted).toBe(false);
    },
  );

  it('giới hạn dung lượng ở đúng 5 MB', () => {
    expect(MAX_IMAGE_BYTES).toBe(5 * 1024 * 1024);
    expect(imageUploadOptions.limits?.fileSize).toBe(MAX_IMAGE_BYTES);
  });

  it('file quá lớn bị từ chối bằng 400 chứ không phải 413', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;

    new ImageTooLargeFilter().catch(new PayloadTooLargeException(), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: TOO_LARGE_MESSAGE,
      }),
    );
  });
});

describe('MediaService.uploadImage', () => {
  let fetchMock: jest.Mock;

  async function createService(
    config: Record<string, string> = CONFIG,
  ): Promise<MediaService> {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: ConfigService,
          useValue: { get: (key: string) => config[key] },
        },
      ],
    }).compile();
    return moduleRef.get(MediaService);
  }

  beforeEach(() => {
    jest.restoreAllMocks();
    // Service ghi log chi tiết lỗi Cloudinary; test không cần thấy trên màn hình.
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('thành công thì trả secure_url của Cloudinary', async () => {
    const service = await createService();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        secure_url: 'https://res.cloudinary.com/demo-cloud/image/upload/v1/a.jpg',
      }),
    });

    const result = await service.uploadImage(makeFile());

    expect(result).toEqual({
      url: 'https://res.cloudinary.com/demo-cloud/image/upload/v1/a.jpg',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.cloudinary.com/v1_1/demo-cloud/image/upload');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
  });

  it('gửi đúng các tham số đã ký và chữ ký là SHA-1 hex 40 ký tự', async () => {
    const service = await createService();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ secure_url: 'https://res.cloudinary.com/x.jpg' }),
    });

    await service.uploadImage(makeFile());

    const form = (fetchMock.mock.calls[0] as [string, RequestInit])[1]
      .body as FormData;
    expect(form.get('folder')).toBe('recipe-app/recipes');
    expect(form.get('api_key')).toBe(CONFIG.CLOUDINARY_API_KEY);
    expect(form.get('file')).toBeInstanceOf(Blob);

    const timestamp = form.get('timestamp') as string;
    expect(timestamp).toMatch(/^\d{10}$/);

    const signature = form.get('signature') as string;
    expect(signature).toMatch(/^[0-9a-f]{40}$/);
    // Chữ ký phải khớp chuỗi "folder=...&timestamp=<ts><api_secret>".
    const { createHash } = await import('node:crypto');
    const expected = createHash('sha1')
      .update(
        `folder=recipe-app/recipes&timestamp=${timestamp}${CONFIG.CLOUDINARY_API_SECRET}`,
      )
      .digest('hex');
    expect(signature).toBe(expected);
  });

  it.each([
    ['CLOUDINARY_CLOUD_NAME'],
    ['CLOUDINARY_API_KEY'],
    ['CLOUDINARY_API_SECRET'],
  ])('thiếu %s thì trả 503 và không gọi Cloudinary', async (missing) => {
    const config = { ...CONFIG };
    delete config[missing as keyof typeof CONFIG];
    const service = await createService(config);

    await expect(service.uploadImage(makeFile())).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    await expect(service.uploadImage(makeFile())).rejects.toThrow(
      'Chưa cấu hình dịch vụ ảnh',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('không gọi được Cloudinary thì trả 502', async () => {
    const service = await createService();
    fetchMock.mockRejectedValue(new Error('ECONNRESET'));

    await expect(service.uploadImage(makeFile())).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('Cloudinary trả lỗi HTTP thì trả 502 với thông báo tiếng Việt', async () => {
    const service = await createService();
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => '{"error":{"message":"Invalid Signature"}}',
    });

    await expect(service.uploadImage(makeFile())).rejects.toThrow(
      'Không tải được ảnh lên. Vui lòng thử lại.',
    );
  });

  it('Cloudinary trả body thiếu secure_url thì cũng là 502', async () => {
    const service = await createService();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ public_id: 'recipe-app/recipes/abc' }),
    });

    await expect(service.uploadImage(makeFile())).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});
