import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  // @Transform: bỏ khoảng trắng 2 đầu (trim) và đổi về chữ thường.
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(255, { message: 'Email tối đa 255 ký tự' })
  email!: string;

  // Quy tắc này PHẢI GIỐNG với mobile/src/utils/validators.ts. Muốn đổi thì sửa cả hai nơi.
  @IsString({ message: 'Mật khẩu không hợp lệ' })
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  @MaxLength(72, { message: 'Mật khẩu tối đa 72 ký tự' })
  // Trong chuỗi phải có ít nhất 1 chữ cái (a-z) và 1 chữ số (0-9).
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Mật khẩu phải gồm cả chữ cái và chữ số',
  })
  password!: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsString({ message: 'Họ tên không hợp lệ' })
  @MaxLength(100, { message: 'Họ tên tối đa 100 ký tự' })
  name?: string;
}
