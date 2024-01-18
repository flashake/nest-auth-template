import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Validate } from 'class-validator';
import { IsPasswordsMatchingConstraint } from '@common/decorators';

export class RegisterDto {
  @ApiProperty({ example: 'user@mail.ru', description: 'Почтовый адрес' })
  @IsString({ message: 'Ожидается строка' })
  @IsEmail({}, { message: 'Некорректный почтовый ящик' })
  readonly email: string;

  @ApiProperty({ example: 'password', description: 'Пароль' })
  @IsString({ message: 'Ожидается строка' })
  @Length(8, 16, { message: 'Длина пароля должна быть от 8 до 16 символов' })
  readonly password: string;

  @ApiProperty({ example: 'password', description: 'Повтор пароля' })
  @IsString({ message: 'Ожидается строка' })
  @Length(8, 16, { message: 'Длина пароля должна быть от 8 до 16 символов' })
  @Validate(IsPasswordsMatchingConstraint)
  readonly passwordRepeat: string;
}
