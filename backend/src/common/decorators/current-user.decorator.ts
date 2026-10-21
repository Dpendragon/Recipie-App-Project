import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// req.user được JwtStrategy.validate() gán vào sau khi JwtAuthGuard xác minh token thành công.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
