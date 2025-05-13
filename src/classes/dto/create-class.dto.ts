// proyecto/school-sync-backend/src/classes/dto/create-class.dto.ts
import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateClassDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  // accessCode se genera automáticamente
  // teacherId se obtiene del usuario autenticado
}