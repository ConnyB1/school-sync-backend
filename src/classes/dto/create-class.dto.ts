import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}