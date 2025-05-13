import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateAnnouncementDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
