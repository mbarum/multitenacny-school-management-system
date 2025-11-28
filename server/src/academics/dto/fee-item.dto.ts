
import { IsString, IsNotEmpty, IsBoolean, IsArray, ValidateNested, IsUUID, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

class ClassFeeDto {
  @IsUUID()
  classId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;
}

export class CreateFeeItemDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsEnum(['Termly', 'Annually', 'One-Time'])
  frequency!: 'Termly' | 'Annually' | 'One-Time';

  @IsBoolean()
  isOptional!: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassFeeDto)
  classSpecificFees!: ClassFeeDto[];
}

export class UpdateFeeItemDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum(['Termly', 'Annually', 'One-Time'])
  @IsOptional()
  frequency?: 'Termly' | 'Annually' | 'One-Time';

  @IsBoolean()
  @IsOptional()
  isOptional?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassFeeDto)
  @IsOptional()
  classSpecificFees?: ClassFeeDto[];
}
