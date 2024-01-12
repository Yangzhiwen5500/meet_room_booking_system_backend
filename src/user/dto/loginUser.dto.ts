import { IsNotEmpty, MinLength } from 'class-validator';

export class LoginUserDto {
  @IsNotEmpty({
    message: 'username 不能为空',
  })
  username: string;

  @IsNotEmpty({
    message: 'username 不能为空',
  })
  @MinLength(6, {
    message: 'password 不能少于6位',
  })
  password: string;
}
