import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { RegisterUserDto } from './dto/registerUser.dto';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { md5 } from 'src/utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { LoginUserDto } from './dto/loginUser.dto';
import { LoginUserVo } from './vo/login-user.vo';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  private logger = new Logger();

  @InjectRepository(User)
  private userRepository: Repository<User>;

  @InjectRepository(Role)
  private roleRepository: Repository<Role>;

  @InjectRepository(Permission)
  private permissionRepository: Repository<Permission>;

  @Inject(RedisService)
  private redisService: RedisService;

  async register(user: RegisterUserDto) {
    const captcha = await this.redisService.get(`captcha_${user.email}`);

    if (!captcha) {
      throw new HttpException('captcha expired', HttpStatus.BAD_REQUEST);
    }

    if (captcha !== user.captcha) {
      throw new HttpException('captcha wrong', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.userRepository.findOneBy({
      username: user.username,
    });

    if (foundUser) {
      throw new HttpException('User already exist', HttpStatus.BAD_REQUEST);
    }

    const newUser = new User();
    newUser.username = user.username;
    newUser.password = md5(user.password);
    newUser.email = user.email;
    newUser.nickName = user.nickName;

    try {
      await this.userRepository.save(newUser);
      return 'success';
    } catch (err) {
      this.logger.error(err, UserService);
      return 'register fail';
    }
  }

  async login(loginUserDto: LoginUserDto, admin: boolean) {
    // find user
    const user = await this.userRepository.findOne({
      where: {
        username: loginUserDto.username,
        isAdmin: admin,
      },
      relations: ['roles', 'roles.permissions'],
    });
    // check user exist
    if (!user) {
      throw new HttpException('User not exist', HttpStatus.BAD_REQUEST);
    }

    // check password
    if (user.password !== md5(loginUserDto.password)) {
      throw new HttpException('Password wrong', HttpStatus.BAD_REQUEST);
    }

    // return user;

    const vo = new LoginUserVo();
    vo.userInfo = {
      id: user.id,
      username: user.username,
      nickName: user.nickName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      headPic: user.headPic,
      createTime: user.createTime.getTime(),
      isFrozen: user.isFrozen,
      isAdmin: user.isAdmin,
      roles: user.roles.map((item) => item.name),
      permissions: user.roles.reduce((arr, item) => {
        item.permissions.forEach((permission) => {
          if (arr.indexOf(permission) === -1) {
            arr.push(permission);
          }
        });
        return arr;
      }, []),
    };

    return vo;
  }

  async findUserById(userId: number, isAdmin: boolean) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
        isAdmin,
      },
      relations: ['roles', 'roles.permissions'],
    });

    return {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      email: user.email,
      roles: user.roles.map((item) => item.name),
      permissions: user.roles.reduce((arr, item) => {
        item.permissions.forEach((permission) => {
          if (arr.indexOf(permission) === -1) {
            arr.push(permission);
          }
        });
        return arr;
      }, []),
    };
  }

  async findUserDetailById(userId: number) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    return user;
  }

  async updatePassword(passwordDto: UpdateUserPasswordDto) {
    const captcha = await this.redisService.get(
      `update_password_captcha_${passwordDto.email}`,
    );

    console.log(`update_password_captcha_${passwordDto.email}`, captcha);

    if (!captcha) {
      throw new HttpException('captcha expired', HttpStatus.BAD_REQUEST);
    }

    if (captcha !== passwordDto.captcha) {
      throw new HttpException('captcha wrong', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.userRepository.findOne({
      where: {
        username: passwordDto.username,
      },
    });

    if (foundUser.email !== passwordDto.email) {
      throw new HttpException('Email is not correct', HttpStatus.BAD_REQUEST);
    }
    foundUser.password = md5(passwordDto.password);
    try {
      await this.userRepository.save(foundUser);
      return 'password save success';
    } catch (e) {
      this.logger.error(e);
      return 'password save failed';
    }
  }

  async update(userId: number, updateUserDto: UpdateUserDto) {
    const captcha = await this.redisService.get(
      `update_user_captcha_${updateUserDto.email}`,
    );

    if (!captcha) {
      throw new HttpException('captcha expired', HttpStatus.BAD_REQUEST);
    }

    if (captcha !== updateUserDto.captcha) {
      throw new HttpException('captcha wrong', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });
    if (updateUserDto.nickName) {
      foundUser.nickName = updateUserDto.nickName;
    }
    if (updateUserDto.headPic) {
      foundUser.headPic = updateUserDto.headPic;
    }

    try {
      await this.userRepository.save(foundUser);
      return 'update user info success';
    } catch (e) {
      this.logger.error(e, UserService);
      return 'update user info failed';
    }
  }

  async freezeById(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    user.isFrozen = true;
    await this.userRepository.save(user);
  }

  async initData() {
    const user1 = new User();
    user1.username = 'zhangsan';
    user1.password = md5('111111');
    user1.email = 'xxx@xx.com';
    user1.isAdmin = true;
    user1.nickName = '张三';
    user1.phoneNumber = '13233323333';

    const user2 = new User();
    user2.username = 'lisi';
    user2.password = md5('222222');
    user2.email = 'yy@yy.com';
    user2.nickName = '李四';

    const role1 = new Role();
    role1.name = '管理员';

    const role2 = new Role();
    role2.name = '普通用户';

    const permission1 = new Permission();
    permission1.code = 'ccc';
    permission1.description = '访问 ccc 接口';

    const permission2 = new Permission();
    permission2.code = 'ddd';
    permission2.description = '访问 ddd 接口';

    user1.roles = [role1];
    user2.roles = [role2];

    role1.permissions = [permission1, permission2];
    role2.permissions = [permission1];

    await this.permissionRepository.save([permission1, permission2]);
    await this.roleRepository.save([role1, role2]);
    await this.userRepository.save([user1, user2]);
  }

  async findUsers(username, nickName, email, pageNo, pageSize) {
    const skipCount = (pageNo - 1) * pageSize;
    const condition: Record<string, any> = {};
    if (username) {
      condition.username = Like(`%${username}%`);
    }
    if (nickName) {
      condition.nickName = Like(`%${nickName}%`);
    }
    if (email) {
      condition.email = Like(`%${email}%`);
    }

    const [users, total] = await this.userRepository.findAndCount({
      select: [
        'id',
        'username',
        'nickName',
        'email',
        'phoneNumber',
        'isFrozen',
        'headPic',
        'createTime',
      ],
      skip: skipCount,
      take: pageSize,
      where: condition,
    });

    return {
      users,
      total,
    };
  }
}
