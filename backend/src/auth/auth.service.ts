import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// Số "vòng băm" của bcrypt. Càng cao càng an toàn nhưng càng chậm.
const BCRYPT_ROUNDS = 10;

// Một mã băm "giả" (băm từ một chuỗi vô nghĩa). Dùng khi đăng nhập bằng email KHÔNG tồn tại.
const DUMMY_HASH =
  '$2b$10$5n9SSNTapo69SrJz298bjeatCnT3zzkm7/FvYFge3WYa4K6K0q6Dq';

const OTP_EXPIRES_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_REQUESTS = 3;
const OTP_REQUEST_WINDOW_MINUTES = 15;

// Danh sách cột được phép trả về cho client.
const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  createdAt: true,
} as const;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailer: MailerService,
  ) {}

  // ĐĂNG KÝ — tạo tài khoản mới
  async register(dto: RegisterDto) {
    // Email này đã có ai dùng chưa?
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) {
      // 409 Conflict = "xung đột dữ liệu".
      throw new ConflictException('Email đã được sử dụng');
    }

    // Băm mật khẩu.
    const passwordHash = await hash(dto.password, BCRYPT_ROUNDS);

    // Ghi vào database.
    try {
      return await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          name: dto.name ?? null,
        },
        select: PUBLIC_USER_SELECT,
      });
    } catch (error) {
      // 2 request đăng ký CÙNG email gần như cùng lúc. Prisma báo lỗi
      // mã P2002 ("Unique constraint failed"). Đổi thành lỗi 409.
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException('Email đã được sử dụng');
      }
      throw error;
    }
  }

  // ĐĂNG NHẬP — kiểm tra email + mật khẩu, trả về JWT
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    const activeUser = user && user.deletedAt === null ? user : null;

    const passwordMatches = await compare(
      dto.password,
      activeUser ? activeUser.passwordHash : DUMMY_HASH,
    );

    if (!activeUser || !passwordMatches) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Tạo JWT.
    const accessToken = await this.jwtService.signAsync({ sub: activeUser.id });

    return {
      accessToken,
      user: {
        id: activeUser.id,
        email: activeUser.email,
        name: activeUser.name,
        avatarUrl: activeUser.avatarUrl,
      },
    };
  }

  // Sinh mã OTP 6 số, lưu bản băm vào DB, gửi email.
  async forgotPassword(dto: ForgotPasswordDto) {
    const neutralResponse = {
      message: 'Nếu email tồn tại, mã xác nhận đã được gửi',
    };

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || user.deletedAt !== null) {
      return neutralResponse;
    }

    // Chống spam: mỗi tài khoản chỉ được xin mã tối đa 3 lần trong 15 phút.
    const windowStart = new Date(
      Date.now() - OTP_REQUEST_WINDOW_MINUTES * 60 * 1000,
    );
    const recentRequests = await this.prisma.passwordResetOtp.findMany({
      where: { userId: user.id, createdAt: { gte: windowStart } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    if (recentRequests.length >= OTP_MAX_REQUESTS) {
      const unlockAt =
        recentRequests[0].createdAt.getTime() +
        OTP_REQUEST_WINDOW_MINUTES * 60 * 1000;
      const waitMinutes = Math.max(
        1,
        Math.ceil((unlockAt - Date.now()) / 60000),
      );
      this.logger.warn(`Email ${user.email} xin OTP quá ${OTP_MAX_REQUESTS} lần`);
      throw new HttpException(
        {
          message: `Bạn đã yêu cầu mã quá nhiều lần. Vui lòng thử lại sau ${waitMinutes} phút`,
          code: 'OTP_TOO_MANY_REQUESTS',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const otp = randomInt(0, 1_000_000).toString().padStart(6, '0');

    await this.prisma.passwordResetOtp.create({
      data: {
        userId: user.id,
        otpHash: await hash(otp, BCRYPT_ROUNDS),
        expiresAt: new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000),
      },
    });

    try {
      await this.mailer.sendOtpEmail(user.email, otp, OTP_EXPIRES_MINUTES);
    } catch (error) {
      this.logger.error('Gửi email OTP thất bại', error as Error);
    }

    return neutralResponse;
  }

  // Kiểm tra OTP. Đúng thì trả về resetToken (JWT sống ngắn).
  async verifyResetOtp(dto: VerifyResetOtpDto) {
    const expiredError = new BadRequestException({
      message: 'Mã xác nhận đã hết hạn hoặc đã được sử dụng. Vui lòng gửi lại mã',
      code: 'OTP_EXPIRED',
    });

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || user.deletedAt !== null) {
      throw expiredError;
    }

    const record = await this.prisma.passwordResetOtp.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.consumedAt !== null || record.expiresAt < new Date()) {
      throw expiredError;
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException({
        message: 'Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã mới',
        code: 'OTP_LOCKED',
      });
    }

    const otpMatches = await compare(dto.otp, record.otpHash);
    if (!otpMatches) {
      await this.prisma.passwordResetOtp.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      const attemptsLeft = OTP_MAX_ATTEMPTS - (record.attempts + 1);
      if (attemptsLeft > 0) {
        throw new BadRequestException({
          message: `Mã xác nhận không đúng. Bạn còn ${attemptsLeft} lần thử`,
          code: 'OTP_WRONG',
        });
      }
      throw new BadRequestException({
        message: 'Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã mới',
        code: 'OTP_LOCKED',
      });
    }

    const marked = await this.prisma.passwordResetOtp.updateMany({
      where: { id: record.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (marked.count === 0) {
      throw expiredError;
    }

    const resetToken = await this.jwtService.signAsync(
      { sub: user.id, purpose: 'password_reset' },
      { secret: this.getResetTokenSecret(), expiresIn: '10m' },
    );

    return { resetToken };
  }

  // Đặt mật khẩu mới bằng resetToken.
  async resetPassword(dto: ResetPasswordDto) {
    // Kiểm tra chữ ký + hạn của resetToken.
    let payload: { sub: number; purpose?: string };
    try {
      payload = await this.jwtService.verifyAsync(dto.resetToken, {
        secret: this.getResetTokenSecret(),
      });
    } catch {
      throw new UnauthorizedException(
        'Phiên đặt lại mật khẩu đã hết hạn. Vui lòng thực hiện lại từ đầu',
      );
    }

    if (payload.purpose !== 'password_reset') {
      throw new UnauthorizedException('resetToken không hợp lệ');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.deletedAt !== null) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    // Mật khẩu mới không được trùng mật khẩu cũ
    const sameAsOld = await compare(dto.newPassword, user.passwordHash);
    if (sameAsOld) {
      throw new BadRequestException('Mật khẩu mới không được trùng mật khẩu cũ');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hash(dto.newPassword, BCRYPT_ROUNDS) },
    });

    return { message: 'Đặt lại mật khẩu thành công' };
  }

  private getResetTokenSecret(): string {
    const secret = this.config.get<string>('RESET_TOKEN_SECRET');
    if (!secret) {
      this.logger.error('Thiếu RESET_TOKEN_SECRET trong file .env');
      throw new InternalServerErrorException('Máy chủ chưa được cấu hình');
    }
    return secret;
  }
}
