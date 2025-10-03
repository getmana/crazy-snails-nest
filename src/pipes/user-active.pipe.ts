import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class UserActivePipe implements PipeTransform {
  constructor(private prisma: PrismaService) {}

  async transform(value: string) {
    const id = +value;
    const user = await this.prisma.user.findUnique({
      where: { id, isActive: true },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return id;
  }
}
