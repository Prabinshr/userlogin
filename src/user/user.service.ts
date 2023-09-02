import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { Role } from '@prisma/client';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    // private readonly authService: AuthService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    if (createUserDto.email.includes(' ')) {
      throw new HttpException('Username cannot contain spaces', 400);
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: createUserDto.email.toLocaleLowerCase() },
          { phone: createUserDto.phone.toLocaleLowerCase() },
        ],
      },
    });
    if (user) {
      throw new HttpException('Username or Email already exist', 400);
    }
    const hashPassword = await argon.hash(createUserDto.password);
    createUserDto.password = hashPassword;

    const {password,...users} = await this.prisma.user.create({
      data: {
        email: createUserDto.email.toLocaleLowerCase(),
        phone: createUserDto.phone.toLocaleLowerCase(),
        role: Role.USER,
        ...createUserDto,
      },
    });


    return users;
  }

  async findAll() {
    const users = await this.prisma.user.findMany();

    const userData = users.map((user) => {
      const { password, ...others } = user;
      return others;
    });
    return userData;
  }

  async findOne(id: string) {
    const { password, ...other } = await this.prisma.user.findUnique({
      where: { id },
    });
    return other;
  }

  async findOneByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user;
  }
  async findByEmailOrPhone(emailOrPhone: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrPhone }, { phone: emailOrPhone }],
      },
    });
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      const hashPassword = await argon.hash(updateUserDto.password);
      updateUserDto.password = hashPassword;
    }
    const { password, ...updateUser } = await this.prisma.user.update({
      data: {
        email: updateUserDto.email.toLocaleLowerCase(),
        phone: updateUserDto.phone.toLocaleLowerCase(),
        ...updateUserDto,
      },
      where: { id },
    });
    return updateUser;
  }

  async remove(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return `This action removes user`;
  }
}
