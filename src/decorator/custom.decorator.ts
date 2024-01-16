import {
  ExecutionContext,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';

export const RequireLogin = () => SetMetadata('require-login', true);
export const requirePermission = (...permission: string[]) =>
  SetMetadata('require-permission', permission);

export const UserInfo = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (!request.user) {
      return null;
    }

    return data ? request.user[data] : request.user;
  },
);
