import { IsString, IsDateString, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class JournalEntryDto {
  @IsString()
  accountId!: string;

  @IsNumber()
  debit!: number;

  @IsNumber()
  credit!: number;
}

export class CreateJournalDto {
  @IsDateString()
  date!: string;

  @IsString()
  reference!: string;

  @IsString()
  memo!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryDto)
  entries!: JournalEntryDto[];
}
