import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/registerUser.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  login(@Body() registerUser: RegisterUserDto) {
    console.log(registerUser);
    return 'success';
  }
}
