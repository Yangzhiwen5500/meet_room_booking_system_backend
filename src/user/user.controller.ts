import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/registerUser.dto';
import { LoginUserDto } from './dto/loginUser.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RequireLogin, UserInfo } from 'src/decorator/custom.decorator';
import { UserDetailVo } from './vo/user-detail.vo';

@Controller('user')
export class UserController {
  @Inject(ConfigService)
  private configService: ConfigService;

  @Inject(JwtService)
  private jwtService: JwtService;

  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    return await this.userService.register(registerUser);
  }

  @Get('init')
  async init() {
    await this.userService.initData();
    return 'success';
  }

  @Post('login')
  async userLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, false);

    vo.accessToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
        username: vo.userInfo.username,
        roles: vo.userInfo.roles,
        permissions: vo.userInfo.permissions,
      },
      {
        expiresIn:
          this.configService.get('jwt_access_token_expires_time') || '30m',
      },
    );

    vo.refreshToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
      },
      {
        expiresIn:
          this.configService.get('jwt_refresh_token_expres_time') || '7d',
      },
    );

    return vo;
  }

  @Post('admin/login')
  async adminLogin(@Body() loginAdmin: LoginUserDto) {
    const vo = await this.userService.login(loginAdmin, true);
    const payload = {
      userId: vo.userInfo.id,
      username: vo.userInfo.username,
      roles: vo.userInfo.roles,
      permissions: vo.userInfo.permissions,
    };

    vo.accessToken = this.jwtService.sign(payload, {
      expiresIn:
        this.configService.get('jwt_access_token_expires_time') || '30m',
    });

    vo.refreshToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
      },
      {
        expiresIn:
          this.configService.get('jwt_refresh_token_expres_time') || '7d',
      },
    );

    return vo;
  }

  @Get('refresh')
  async refresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken);

      const user = await this.userService.findUserById(data.userId, false);

      console.log('-----------', user);
      const payload = {
        userId: user.id,
        username: user.username,
        roles: user.roles,
        permissions: user.permissions,
      };
      const access_token = this.jwtService.sign(payload, {
        expiresIn:
          this.configService.get('jwt_access_token_expires_time') || '30m',
      });
      const refresh_payload = {
        userId: user.id,
      };
      const refresh_token = this.jwtService.sign(refresh_payload, {
        expiresIn:
          this.configService.get('jwt_refresh_token_expres_time') || '7d',
      });

      return {
        access_token,
        refresh_token,
      };
    } catch (err) {
      throw new UnauthorizedException('Token expired, retry login');
    }
  }

  @Get('admin/refresh')
  async adminRefresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken);

      const user = await this.userService.findUserById(data.userId, true);

      const access_token = this.jwtService.sign(
        {
          userId: user.id,
          username: user.username,
          roles: user.roles,
          permissions: user.permissions,
        },
        {
          expiresIn:
            this.configService.get('jwt_access_token_expires_time') || '30m',
        },
      );

      const refresh_token = this.jwtService.sign(
        {
          userId: user.id,
        },
        {
          expiresIn:
            this.configService.get('jwt_refresh_token_expres_time') || '7d',
        },
      );

      return {
        access_token,
        refresh_token,
      };
    } catch (e) {
      throw new UnauthorizedException('token 已失效，请重新登录');
    }
  }

  @Get('info')
  @RequireLogin()
  async info(@UserInfo('userId') userId: number) {
    const user = await this.userService.findUserDetailById(userId);
    const vo = new UserDetailVo();
    vo.id = user.id;
    vo.nickName = user.nickName;
    vo.createTime = user.createTime;
    vo.email = user.email;
    vo.headPic = user.headPic;
    vo.isFrozen = user.isFrozen;
    vo.phoneNumber = user.phoneNumber;
    vo.username = user.username;

    return vo;
  }
}
