import { Token } from '@prisma/client';

export interface Tokens {
  accessToken: string;
  refreshToken: Token;
}

export interface JwtPayload {
  id: number;
  email: string;
  roles: string[];
}
