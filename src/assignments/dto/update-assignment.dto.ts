// proyecto/school-sync-backend/src/assignments/dto/update-assignment.dto.ts
import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateAssignmentDto } from './create-assignment.dto';

export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {
  classId?: never; // No se permite actualizar el classId de una tarea existente
}