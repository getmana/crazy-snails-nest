import { Module } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { SharedUsersService } from './shared-users.service';

@Module({
  providers: [PrismaService, SharedUsersService],
  exports: [SharedUsersService],
})
export class SharedModule {}
