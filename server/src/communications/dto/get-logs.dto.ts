
import { IsOptional, IsInt, Min, IsUUID, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CommunicationType } from '../../entities/communication-log.entity';

export class GetCommunicationLogsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString() // Changed from IsUUID to IsString
  studentId?: string;

  @IsOptional()
  @IsEnum(CommunicationType)
  type?: CommunicationType;
}
