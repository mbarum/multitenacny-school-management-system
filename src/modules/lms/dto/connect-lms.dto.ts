import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { LmsProviderType } from '../entities/lms-connection.entity';

export class ConnectLmsDto {
  @IsEnum(LmsProviderType)
  @IsNotEmpty()
  provider: LmsProviderType;

  @IsUrl()
  @IsNotEmpty()
  apiUrl: string;

  @IsString()
  @IsNotEmpty()
  credential1: string; // API Key, Client ID, etc.

  @IsString()
  @IsOptional()
  credential2?: string; // Client Secret, etc.
}
