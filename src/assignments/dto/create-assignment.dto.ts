// proyecto/school-sync-backend/src/assignments/dto/create-assignment.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty({ message: 'El título de la tarea no puede estar vacío.' })
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString({}, { message: 'La fecha de entrega debe ser una fecha válida.' })
  @IsOptional()
  dueDate?: string;

  @IsUUID()
  @IsNotEmpty({ message: 'La tarea debe estar asociada a una clase.' })
  classId: string;

  // Propiedad para la URL del archivo adjunto
  @IsOptional()
  @IsString()
  assignmentFileUrl?: string; // <-- Este es el nombre correcto
}