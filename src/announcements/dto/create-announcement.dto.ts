// proyecto/school-sync-backend/src/announcements/dto/create-announcement.dto.ts
import { IsString, MinLength, MaxLength, IsOptional, IsUUID, IsUrl, IsNotEmpty } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title: string;

  @IsString()
  @MinLength(5)
  content: string;

  @IsUUID('4', { message: 'El ID de la clase debe ser un UUID válido.'})
  @IsNotEmpty({ message: 'El ID de la clase es obligatorio para un anuncio.' })
  classId: string;

  @IsOptional()
  @IsUrl({}, { message: 'La URL de la imagen debe ser válida.'})
  imageUrl?: string;
}