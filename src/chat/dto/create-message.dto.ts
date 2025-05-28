// proyecto/school-sync-backend/src/chat/dto/create-message.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { RoomType } from '../entities/message.entity';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsEnum(RoomType)
  roomType: RoomType;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional() 
  @IsString()
  tempId?: string; 
}