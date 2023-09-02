import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from 'src/auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';


@Module({
  imports:[AuthModule],
  controllers: [UserController],
  providers: [UserService,JwtService,PrismaService,AuthService],
  exports:[UserService]
})
export class UserModule {}
