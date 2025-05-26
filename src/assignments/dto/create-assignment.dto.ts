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
  @IsOptional() // Puede ser opcional si se permite que el profesor lo deje sin fecha inicial
  dueDate?: string;

  @IsUUID()
  @IsNotEmpty({ message: 'La tarea debe estar asociada a una clase.' })
  classId: string;

  // FIXED: Añadida propiedad para la URL del archivo adjunto
  @IsOptional()
  @IsString()
  assignmentFileUrl?: string;
}