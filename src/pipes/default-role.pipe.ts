import { PipeTransform, Injectable } from '@nestjs/common';
import { CreateUserPayload } from 'src/modules/users/users.dto';
import { Role } from '@prisma/client';

@Injectable()
export class DefaultRolePipe implements PipeTransform {
  transform(value: CreateUserPayload) {
    return { ...value, role: Role.editor };
  }
}
