import {
  Body,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as argon from 'argon2';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from 'src/decorator';
import { TOKENS } from 'config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async generateToken(payload: any) {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: payload.id,
        email: payload.email,
        role: payload.role,
      },
      {
        secret: TOKENS.TOKEN_SECRET,
        expiresIn: TOKENS.TOKEN_EXPIRES_IN,
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: payload.id,
        email: payload.email,
        role: payload.role,
      },
      {
        secret: TOKENS.REFRESH_TOKEN,
        expiresIn: TOKENS.REFRESH_TOKEN_EXPIRES_IN,
      },
    );
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmailOrPhone(email);

    const hashPassword = await argon.verify(user.password, password);
    if (!user || !hashPassword)
      throw new HttpException('Invalid Credentials', HttpStatus.CONFLICT);

    return user;
  }

  async login(
    loginDto: LoginDto,
    @CurrentUser() currentUser: any,
  ): Promise<any> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const { id, email, role } = user;
    const token = await this.generateToken({ id, email, role });

    if (!token) {
      throw new InternalServerErrorException("Couldn't generate token");
    }

    const refreshTokenExist = await this.prisma.refreshToken.findUnique({
      where: { userId: currentUser.id },
    });
    if (refreshTokenExist) {
      await this.prisma.refreshToken.update({
        where: { userId: currentUser.id },
        data: {
          token_hash: await argon.hash(token.refresh_token),
        },
      });
    } else {
      await this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          token_hash: await argon.hash(token.refresh_token),
        },
      });
    }

    return token;
  }

  async register(createUserDto:CreateUserDto){
    const user = await this.userService.create(createUserDto)

    const token = await this.generateToken(user);

    if (!token) {
      throw new InternalServerErrorException("Couldn't generate token");
    }

    const refreshTokenExist = await this.prisma.refreshToken.findFirst({
      where: { userId: user.id },
    });
    if (refreshTokenExist) {
      await this.prisma.refreshToken.update({
        where: { userId: user.id },
        data: {
          token_hash: await argon.hash(token.refresh_token),
        },
      });
    } else {
      await this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          token_hash: await argon.hash(token.refresh_token),
        },
      });
    }

    return token;
  }

  
}
