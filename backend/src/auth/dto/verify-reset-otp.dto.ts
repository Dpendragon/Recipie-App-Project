import { Transform } from 'class-transformer';
import { IsEmail, Matches } from 'class-validator';

export class VerifyResetOtpDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  // Mã OTP phải đúng 6 chữ số
  @Matches(/^\d{6}$/, { message: 'Mã xác thực gồm đúng 6 chữ số' })
  otp!: string;
}
