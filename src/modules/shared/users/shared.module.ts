import { Module } from '@nestjs/common';
import { SharedUsersService } from './shared-users.service';

@Module({
  providers: [SharedUsersService],
  exports: [SharedUsersService],
})
export class SharedModule {}
