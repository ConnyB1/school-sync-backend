// proyecto/school-sync-backend/src/classes/dto/join-class.dto.ts
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class JoinClassDto {
  @IsNotEmpty()
  @IsString()
  @Length(6, 10) // Ajusta según la longitud de tus códigos
  accessCode: string;
}