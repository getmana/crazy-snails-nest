import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCodes } from 'src/constants/error-codes';
import { PrismaService } from 'src/modules/prisma/prisma.service';

// TODO Move prisma call to service layer
@Injectable()
export class UserActivePipe implements PipeTransform {
  constructor(private prisma: PrismaService) {}

  async transform(value: string) {
    const id = +value;
    const user = await this.prisma.user.findUnique({
      where: { id, isActive: true },
    });
    if (!user) {
      throw new NotFoundException({
        message: `User with ID ${id} not found`,
        code: ErrorCodes.USER_NOT_FOUND,
      });
    }
    return id;
  }
}
