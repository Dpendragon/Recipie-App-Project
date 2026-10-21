import { SetMetadata } from '@nestjs/common';

// Đánh dấu route KHÔNG cần JWT hợp lệ
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
