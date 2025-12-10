
import { IsString, IsNotEmpty, IsUUID, IsDateString } from 'class-validator';

export class IssueBookDto {
  @IsUUID()
  @IsNotEmpty()
  bookId!: string;

  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate!: string;
}
