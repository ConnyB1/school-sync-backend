// proyecto/school-sync-backend/src/chat/dto/create-message.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { RoomType } from '../entities/message.entity';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'El contenido del mensaje no puede estar vacío.' })
  content: string;

  @IsString()
  @IsNotEmpty({ message: 'El ID de la sala (roomId) es requerido.' })
  roomId: string;

  @IsEnum(RoomType, { message: 'El tipo de sala (roomType) no es válido.' })
  @IsNotEmpty({ message: 'El tipo de sala (roomType) es requerido.' })
  roomType: RoomType;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de la clase (classId) debe ser un UUID válido.' }) // Asume que classId es UUID
  classId?: string; // Solo es relevante si roomType es CLASS
}