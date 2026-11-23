import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  // resetToken nhận được sau khi xác minh OTP thành công.
  @IsString({ message: 'resetToken không hợp lệ' })
  @IsNotEmpty({ message: 'Thiếu resetToken' })
  resetToken!: string;

  @IsString({ message: 'Mật khẩu không hợp lệ' })
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  @MaxLength(72, { message: 'Mật khẩu tối đa 72 ký tự' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Mật khẩu phải gồm cả chữ cái và chữ số',
  })
  newPassword!: string;
}
