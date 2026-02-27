import { IsBoolean, IsOptional } from 'class-validator';

export class SyncRequestDto {
  @IsBoolean()
  @IsOptional()
  forceFullSync?: boolean = false;
}
