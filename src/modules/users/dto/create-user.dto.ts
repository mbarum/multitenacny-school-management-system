import { IsString, IsEnum, MinLength, IsNotEmpty } from 'class-validator';
import { UserRole } from 'src/common/user-role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(8)
  password_hash: string;

  @IsEnum(UserRole)
  role: UserRole;
}
