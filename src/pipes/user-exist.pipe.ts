import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateUserDto } from 'src/modules/users/users.dto';

// TODO move prisma call to service layer, use ConflictException
@Injectable()
export class UserExistPipe implements PipeTransform {
  constructor(private prisma: PrismaService) {}

  async transform(value: CreateUserDto) {
    const { email, username } = value;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        existingUser.email === email
          ? 'A user with this email already exists'
          : 'A user with this username already exists',
      );
    }

    return value;
  }
}
