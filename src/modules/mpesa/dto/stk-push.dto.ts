import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class StkPushDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
