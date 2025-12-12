
import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetLibraryTransactionsDto {
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
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  studentId?: string;

   @IsOptional()
  @IsString()
  pagination?: string;
}
