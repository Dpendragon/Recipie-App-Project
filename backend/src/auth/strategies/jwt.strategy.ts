import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

// Payload do bước đăng nhập sẽ ký: { sub: user.id }.
type JwtPayload = { sub: number };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? '',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    // Token cũ của một tài khoản đã xoá phải bị từ chối dù chữ ký JWT vẫn còn hạn.
    if (!user || user.deletedAt !== null) {
      throw new UnauthorizedException();
    }

    // Không trả passwordHash ra ngoài req.user.
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
