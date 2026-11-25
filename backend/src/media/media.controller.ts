import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  Controller,
  ExceptionFilter,
  HttpStatus,
  PayloadTooLargeException,
  Post,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { MediaService } from './media.service';

// POST /media/images (Mục 8): nhận ảnh rồi trả URL để mobile lưu vào
// recipes.image_url hoặc users.avatar_url. Ảnh chỉ đi qua bộ nhớ, không ghi đĩa
// và không lưu binary trong MySQL.
export const MAX_IMAGE_MB = 5;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const WRONG_TYPE_MESSAGE = 'Ảnh phải có định dạng JPEG, PNG hoặc WebP';
export const TOO_LARGE_MESSAGE = `Ảnh vượt quá ${MAX_IMAGE_MB} MB`;
export const MISSING_FILE_MESSAGE = 'Chưa chọn ảnh để tải lên';

export const imageUploadOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      callback(new BadRequestException(WRONG_TYPE_MESSAGE), false);
      return;
    }
    callback(null, true);
  },
};

// Vượt limits.fileSize thì multer dừng giữa chừng và NestJS dịch thành 413.
// Với client đây vẫn là "file gửi lên không hợp lệ" nên trả 400 như lỗi sai
// định dạng, kèm thông báo tiếng Việt.
@Catch(PayloadTooLargeException)
export class ImageTooLargeFilter implements ExceptionFilter {
  catch(_exception: PayloadTooLargeException, host: ArgumentsHost): void {
    host.switchToHttp().getResponse<Response>().status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: TOO_LARGE_MESSAGE,
      error: 'Bad Request',
    });
  }
}

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('images')
  @UseFilters(ImageTooLargeFilter)
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  upload(@UploadedFile() file?: Express.Multer.File): Promise<{ url: string }> {
    if (!file) throw new BadRequestException(MISSING_FILE_MESSAGE);
    return this.mediaService.uploadImage(file);
  }
}
