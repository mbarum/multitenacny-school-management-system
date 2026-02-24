import { UserRole } from 'src/common/user-role.enum';

export class CreateUserDto {
  username: string;
  password_hash: string;
  role: UserRole;
}
