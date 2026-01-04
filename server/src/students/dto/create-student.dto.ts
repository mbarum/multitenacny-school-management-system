
import { IsString, IsNotEmpty, IsEmail, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty({ message: 'Legal Name is required' })
  name!: string;

  @IsUUID('4', { message: 'A valid Class selection is required' })
  @IsNotEmpty()
  classId!: string;

  @IsString()
  @IsOptional()
  profileImage?: string;

  @IsString()
  @IsNotEmpty({ message: 'Guardian Name is required' })
  guardianName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Primary Contact phone is required' })
  guardianContact!: string;

  @IsString()
  @IsNotEmpty({ message: 'Residential Address is required' })
  guardianAddress!: string;

  @IsEmail({}, { message: 'A valid Guardian Email is required' })
  guardianEmail!: string;

  @IsString()
  @IsNotEmpty({ message: 'Emergency Contact is required' })
  emergencyContact!: string;

  @IsDateString({}, { message: 'Date of Birth must be a valid date' })
  @IsNotEmpty({ message: 'Date of Birth is required' })
  dateOfBirth!: string;
}
