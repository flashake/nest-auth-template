import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@mail.ru', description: 'Почтовый адрес' })
  @IsString({ message: 'Ожидается строка' })
  @IsEmail({}, { message: 'Некорректный почтовый ящик' })
  readonly email: string;

  @ApiProperty({ example: 'password', description: 'Пароль' })
  @IsString({ message: 'Ожидается строка' })
  @Length(8, 16, { message: 'Длина пароля должна быть от 8 до 16 символов' })
  readonly password: string;
}
