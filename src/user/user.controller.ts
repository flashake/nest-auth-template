import {
  Controller,
  Get,
  Param,
  Delete,
  ParseUUIDPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  Post,
  Body,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserResponse } from './responses';
import { CurrentUser, Roles } from '@common/decorators';
import { JwtPayload } from '../auth/interfaces';
import { Role } from '@prisma/client';
import { AddRoleDto } from './dto';

// TODO: block user
@ApiTags('Пользователи')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Полуение пользователя' })
  @ApiResponse({ status: 200, type: UserResponse })
  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':id')
  async findOne(@Param('id') id: number) {
    const user = await this.userService.findOne(id);

    return new UserResponse(user);
  }

  @ApiOperation({ summary: 'Удаление пользователя' })
  @ApiResponse({ status: 200 })
  @UseInterceptors(ClassSerializerInterceptor)
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.userService.remove(id, currentUser);
  }

  @Get()
  currentUser(@CurrentUser() user: JwtPayload) {
    return this.userService.findOne(user.id);
  }

  @ApiOperation({ summary: 'Выдать роль' })
  @ApiResponse({ status: 200, type: UserResponse })
  @Roles(Role.ADMIN)
  @Post('/add-role')
  addRole(@Body() payload: AddRoleDto) {
    return this.userService.addRole(payload);
  }
}
