import { Provider, Role, User } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponse implements User {
  @ApiProperty({ example: 1, description: 'Идентификатор' })
  id: number;

  @ApiProperty({ example: 'user@mail.ru', description: 'Почтовый адрес' })
  email: string;

  @ApiProperty({ example: 'user@mail.ru', description: 'Дата изменения' })
  updatedAt: Date;
  roles: Role[];

  @Exclude()
  password: string;

  @Exclude()
  createdAt: Date;

  @Exclude()
  provider: Provider;

  @Exclude()
  isBlocked: boolean;

  constructor(user: User) {
    Object.assign(this, user);
  }
}
