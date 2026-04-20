import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class BulkUpdateStudentDto {
  @IsArray()
  @IsUUID('all', { each: true })
  studentIds: string[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  classLevelId?: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;
}
