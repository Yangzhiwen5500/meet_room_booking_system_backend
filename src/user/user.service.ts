import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { RegisterUserDto } from './dto/registerUser.dto';
import { User } from './entities/user.entity';
import { md5 } from 'src/utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  private logger = new Logger();

  @InjectRepository(User)
  private userRepository: Repository<User>;

  @Inject(RedisService)
  private redisService: RedisService;

  async register(user: RegisterUserDto) {
    const captcha = await this.redisService.get(`captcha_${user.email}`);

    if (!captcha) {
      throw new Error('captcha expired');
    }

    if (captcha !== user.captcha) {
      throw new Error('captcha wrong');
    }

    const foundUser = await this.userRepository.findOneBy({
      username: user.username,
    });

    if (foundUser) {
      throw new Error('User already exist');
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
}
