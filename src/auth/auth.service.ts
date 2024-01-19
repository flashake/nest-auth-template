import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto';
import { UserService } from '../user/user.service';
import { Tokens } from './interfaces';
import { compare } from 'bcrypt';
import { Provider, Token, User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { v4 } from 'uuid';
import { add } from 'date-fns';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {}

  async register(payload: RegisterDto) {
    try {
      const user: User = await this.userService
        .findOneByEmail(payload.email)
        .catch((err) => {
          this.logger.error(err);
          throw new InternalServerErrorException('Что то пошло не так');
        });

      if (user) {
        throw new ConflictException(
          'Пользователь с такой почтой уже зарегестрирован',
        );
      }

      return await this.userService.create(payload);
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerErrorException(
        'Не улалось зарегестрировать пользователя',
      );
    }
  }

  async login(payload: LoginDto, agent: string): Promise<Tokens> {
    const user: User = await this.userService
      .findOneByEmail(payload.email, true)
      .catch((err) => {
        this.logger.error(err);
        throw new InternalServerErrorException('Что то пошло не так');
      });
    const passwordsEq =
      user?.password && (await compare(payload.password, user.password));

    if (!user || !passwordsEq) {
      throw new UnauthorizedException('Не верный логин или пароль');
    }

    return this.generateTokens(user, agent);
  }

  async providerAuth(email: string, agent: string, provider: Provider) {
    const userExists = await this.userService.findOneByEmail(email);
    if (userExists) {
      const user = await this.userService
        .create({ email, provider })
        .catch((err) => {
          this.logger.error(err);
          return null;
        });
      return this.generateTokens(user, agent);
    }
    const user = await this.userService
      .create({ email, provider })
      .catch((err) => {
        this.logger.error(err);
        return null;
      });
    if (!user) {
      throw new HttpException(
        `Не получилось создать пользователя с email ${email}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.generateTokens(user, agent);
  }

  deleteRefreshToken(token: string) {
    return this.prismaService.token.delete({ where: { token } });
  }

  async refreshTokens(refreshToken: string, agent: string): Promise<Tokens> {
    const token = await this.prismaService.token.delete({
      where: { token: refreshToken },
    });
    if (!token || new Date(token.exp) < new Date()) {
      throw new UnauthorizedException();
    }
    const user = await this.userService.findOne(token.userId);
    return this.generateTokens(user, agent);
  }

  private async generateTokens(user: User, agent: string): Promise<Tokens> {
    const accessToken =
      'Bearer ' +
      this.jwtService.sign({
        id: user.id,
        email: user.email,
        roles: user.roles,
      });
    const refreshToken = await this.getRefreshToken(user.id, agent);
    return { accessToken, refreshToken };
  }

  private async getRefreshToken(userId: number, agent: string): Promise<Token> {
    const _token = await this.prismaService.token.findFirst({
      where: {
        userId,
        userAgent: agent,
      },
    });
    const token = _token?.token;

    if (token) {
      return this.prismaService.token.update({
        where: { token },
        data: {
          token: v4(),
          exp: add(new Date(), { months: 1 }),
        },
      });
    }

    return this.prismaService.token.create({
      data: {
        token: v4(),
        exp: add(new Date(), { months: 1 }),
        userId,
        userAgent: agent,
      },
    });
  }
}
