
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateGradingRuleDto {
  @IsString()
  @IsNotEmpty()
  grade!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  minScore!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  maxScore!: number;
}

export class UpdateGradingRuleDto {
  @IsString()
  @IsOptional()
  grade?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  minScore?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  maxScore?: number;
}
