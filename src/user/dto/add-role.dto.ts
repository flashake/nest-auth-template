import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AddRoleDto {
  @ApiProperty({ example: 'ADMIN', description: 'Роль' })
  readonly role: Role;

  @ApiProperty({ example: '1', description: 'Идентификатор пользователя' })
  readonly userId: number;
}
