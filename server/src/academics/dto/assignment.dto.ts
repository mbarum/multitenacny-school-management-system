import { IsUUID, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAssignmentDto {
  @IsUUID()
  @IsNotEmpty()
  classId!: string;
  
  @IsUUID()
  @IsNotEmpty()
  subjectId!: string;

  @IsUUID()
  @IsNotEmpty()
  teacherId!: string;
}

export class UpdateAssignmentDto {
  @IsUUID()
  @IsOptional()
  classId?: string;
  
  @IsUUID()
  @IsOptional()
  subjectId?: string;

  @IsUUID()
  @IsOptional()
  teacherId?: string;
}
