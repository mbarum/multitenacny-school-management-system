import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  username: string;
  password_hash: string;
  role: UserRole;
}
