import { GoogleGuard } from './google.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './role.guard';
import { YandexGuard } from './yandex.guard';
export { JwtAuthGuard } from './jwt-auth.guard';

export const GUARDS = [JwtAuthGuard, RolesGuard, GoogleGuard, YandexGuard];
