import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  controllers: [UserController],
  exports: [UserService],
  providers: [UserService],
  imports: [CacheModule.register()],
})
export class UserModule {}
