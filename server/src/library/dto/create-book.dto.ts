
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  author!: string;

  @IsString()
  @IsOptional()
  isbn?: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsNumber()
  @Min(1)
  totalQuantity!: number;

  @IsString()
  @IsOptional()
  shelfLocation?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;
}
