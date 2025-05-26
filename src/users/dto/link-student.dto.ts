// src/users/dto/link-student.dto.ts (Modificado)
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class LinkStudentDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: 'El ID del alumno debe ser un UUID válido.'}) // Asumiendo que usas UUIDs
  studentId: string; // Cambiado de studentAuth0Id
}