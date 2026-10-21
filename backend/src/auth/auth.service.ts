import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// Số "vòng băm" của bcrypt. Càng cao càng an toàn nhưng càng chậm.
const BCRYPT_ROUNDS = 10;

// Một mã băm "giả" (băm từ một chuỗi vô nghĩa). Dùng khi đăng nhập bằng email KHÔNG tồn tại.
const DUMMY_HASH =
  '$2b$10$5n9SSNTapo69SrJz298bjeatCnT3zzkm7/FvYFge3WYa4K6K0q6Dq';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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
}
