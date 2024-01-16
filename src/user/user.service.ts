import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { hash } from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(user: Partial<User>) {
    const hashedPassword = await this.hashPassword(user.password);
    return this.prismaService.user.create({
      data: { email: user.email, password: hashedPassword, roles: ['USER'] },
    });
  }

  findOne(idOrEmail: string) {
    return this.prismaService.user.findFirst({
      where: { OR: [{ id: idOrEmail }, { email: idOrEmail }] },
    });
  }

  remove(id: string) {
    return this.prismaService.user.delete({ where: { id } });
  }

  private async hashPassword(password: string) {
    return await hash(password, 5);
  }
}