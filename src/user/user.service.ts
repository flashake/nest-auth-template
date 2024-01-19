import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, User } from '@prisma/client';
import { hash } from 'bcrypt';
import { JwtPayload } from '../auth/interfaces';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AddRoleDto } from './dto';
import { convertToSecondsUtil } from '@common/utils';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}
  async create(user: Partial<User>) {
    const hashedPassword = await this.hashPassword(user.password);
    const newUser = await this.prismaService.user.upsert({
      where: {
        email: user.email,
      },
      update: {
        password: hashedPassword ?? undefined,
        provider: user?.provider ?? undefined,
      },
      create: {
        email: user.email,
        password: hashedPassword,
        provider: user?.provider,
        roles: ['USER'],
      },
    });

    await this.cacheManager.set(
      String(newUser.id),
      user,
      convertToSecondsUtil(this.configService.get('JWT_EXP')),
    );

    return newUser;
  }

  async findOne(id: number) {
    const userId = String(id);
    const user = await this.cacheManager.get<User>(userId);
    if (!user) {
      const user = await this.prismaService.user.findFirst({
        where: { id },
      });
      if (!user) {
        return null;
      }
      await this.cacheManager.set(
        userId,
        user,
        convertToSecondsUtil(this.configService.get('JWT_EXP')),
      );
      return user;
    }
    return user;
  }

  async findOneByEmail(email: string, resetCache = false) {
    const user = await this.prismaService.user.findFirst({
      where: { email: email },
    });

    if (resetCache && user) {
      await this.cacheManager.del(String(user.id));
    }

    return user;
  }

  async remove(id: number, user: JwtPayload) {
    if (user.id !== id && !user.roles.includes(Role.ADMIN)) {
      throw new ForbiddenException();
    }
    await Promise.all([
      this.cacheManager.del(String(id)),
      this.cacheManager.del(user.email),
    ]);
    return this.prismaService.user.delete({
      where: { id },
      select: { id: true },
    });
  }

  async addRole(payload: AddRoleDto) {
    const user = await this.prismaService.user.findFirst({
      where: { id: payload.userId },
    });

    if (payload.role in Role && user) {
      return this.prismaService.user.update({
        where: { id: payload.userId },
        data: {
          roles: [...(user?.roles ?? []), payload.role],
        },
      });
    }

    throw new HttpException(
      'Пользователь или роль не найдены',
      HttpStatus.NOT_FOUND,
    );
  }

  private async hashPassword(password: string) {
    return await hash(password, 5);
  }
}
