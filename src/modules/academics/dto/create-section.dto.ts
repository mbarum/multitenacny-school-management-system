import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  name: string;

  @IsUUID()
  classLevelId: string;

  @IsOptional()
  @IsString()
  room?: string;
}
