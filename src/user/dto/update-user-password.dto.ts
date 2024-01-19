import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class UpdateUserPasswordDto {
  @IsNotEmpty({
    message: 'password should not be empty',
  })
  username: string;
  @IsNotEmpty({
    message: 'password should not be empty',
  })
  @MinLength(6, {
    message: 'password should not be shorter than 6 character',
  })
  password: string;

  @IsNotEmpty({
    message: 'email should not be empty',
  })
  @IsEmail(
    {},
    {
      message: 'email invalid',
    },
  )
  email: string;

  @IsNotEmpty({
    message: 'captcha should not be empty',
  })
  captcha: string;
}
