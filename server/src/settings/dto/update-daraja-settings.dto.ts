
import { IsString, IsOptional } from 'class-validator';

export class UpdateDarajaSettingsDto {
  @IsString()
  @IsOptional()
  consumerKey?: string;

  @IsString()
  @IsOptional()
  consumerSecret?: string;

  @IsString()
  @IsOptional()
  shortCode?: string;

  @IsString()
  @IsOptional()
  passkey?: string;

  @IsString()
  @IsOptional()
  paybillNumber?: string;
}
