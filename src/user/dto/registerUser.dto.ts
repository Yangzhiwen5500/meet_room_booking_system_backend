import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty({
    message: 'username 不能为空',
  })
  username: string;
  @IsNotEmpty({
    message: 'nickName 不能为空',
  })
  nickName: string;
  @MinLength(6, {
    message: 'password 不能小于6位',
  })
  password: string;
  @IsNotEmpty({
    message: 'email 不能为空',
  })
  @IsEmail(
    {},
    {
      message: 'email 不合法',
    },
  )
  email: string;
  @IsNotEmpty({
    message: 'captcha 不能为空',
  })
  captcha: string;
}
