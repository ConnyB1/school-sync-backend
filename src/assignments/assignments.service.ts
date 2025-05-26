// proyecto/school-sync-backend/src/assignments/assignments.service.ts
import { Injectable, NotFoundException, ForbiddenException, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from './assignment.entity';
import { Submission } from './submission.entity'; // Importar la entidad Submission
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { User, UserRole } from '../users/user.entity';
import { ClassesService } from '../classes/classes.service';
import { UsersService } from '../users/users.service'; // FIXED: Importar UsersService

@Injectable()
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);

  constructor(
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
    @InjectRepository(Submission) // Inyectar el repositorio de Submission
    private submissionsRepository: Repository<Submission>,
    private classesService: ClassesService,
    private usersService: UsersService, // FIXED: Inyectar UsersService
  ) {}

  async create(createAssignmentDto: CreateAssignmentDto, currentUser: User): Promise<Assignment> {
    // FIXED: Desestructurar assignmentFileUrl del DTO
    const { classId, title, description, dueDate, assignmentFileUrl } = createAssignmentDto; 
    this.logger.log(`Usuario ${currentUser.email} intentando crear tarea "${title}" para clase ${classId}`);

    const classEntity = await this.classesService.findById(classId, currentUser.id);
    if (classEntity.teacherId !== currentUser.id && !currentUser.roles.includes(UserRole.Admin)) {
        throw new ForbiddenException('No tienes permiso para crear tareas en esta clase.');
    }

    const newAssignment = this.assignmentsRepository.create({
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      classId,
      class: classEntity,
      teacherId: currentUser.id,
      teacher: currentUser as User,
      assignmentFileUrl, // FIXED: Asignar assignmentFileUrl
    });

    try {
      return await this.assignmentsRepository.save(newAssignment);
    } catch (error) {
      this.logger.error(`Error al guardar la tarea: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al crear la tarea.');
    }
  }

  async findAllByClass(classId: string, user: User): Promise<Assignment[]> {
    this.logger.log(`Usuario ${user.email} solicitando tareas para la clase ID: ${classId}`);
    await this.classesService.findById(classId, user.id);

    return this.assignmentsRepository.find({
      where: { classId },
      relations: ['teacher'],
      order: { dueDate: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string, classId: string, user: User): Promise<Assignment> {
    this.logger.log(`Usuario ${user.email} solicitando tarea ID: ${id} de clase ID: ${classId}`);

    // Primero, verificar que el usuario tenga acceso a la clase
    await this.classesService.findById(classId, user.id); 

    const assignment = await this.assignmentsRepository.findOne({
      where: { id, classId },
      relations: ['teacher', 'submissions', 'submissions.student'], // Cargar también las entregas y sus estudiantes
    });

    if (!assignment) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada en la clase ${classId}.`);
    }

    return assignment;
  }

  async update(id: string, updateAssignmentDto: UpdateAssignmentDto, currentUser: User): Promise<Assignment> {
    this.logger.log(`Usuario ${currentUser.email} intentando actualizar tarea ID: ${id}`);
    const { classId } = updateAssignmentDto;

    // Verificar si la tarea existe y si el usuario es el profesor o admin de esa clase
    const assignment = await this.assignmentsRepository.findOne({
      where: { id },
      relations: ['class'],
    });

    if (!assignment) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada.`);
    }

    // Verificar que el usuario sea el profesor de la clase o un administrador
    if (assignment.class.teacherId !== currentUser.id && !currentUser.roles.includes(UserRole.Admin)) {
      throw new ForbiddenException('No tienes permiso para editar esta tarea.');
    }

    // Si se actualiza el classId, asegurarse de que el profesor también sea de la nueva clase
    if (classId && classId !== assignment.classId) {
      const newClass = await this.classesService.findById(classId, currentUser.id);
      if (newClass.teacherId !== currentUser.id && !currentUser.roles.includes(UserRole.Admin)) {
        throw new ForbiddenException('No tienes permiso para mover esta tarea a la clase especificada.');
      }
      assignment.classId = classId;
    }

    // Actualizar los campos
    Object.assign(assignment, updateAssignmentDto);

    try {
      return await this.assignmentsRepository.save(assignment);
    } catch (error) {
      this.logger.error(`Error al actualizar la tarea: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al actualizar la tarea.');
    }
  }

  async remove(id: string, currentUser: User): Promise<void> {
    this.logger.log(`Usuario ${currentUser.email} intentando eliminar tarea ID: ${id}`);

    const assignment = await this.assignmentsRepository.findOne({
      where: { id },
      relations: ['class'],
    });

    if (!assignment) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada.`);
    }

    if (assignment.class.teacherId !== currentUser.id && !currentUser.roles.includes(UserRole.Admin)) {
      throw new ForbiddenException('No tienes permiso para eliminar esta tarea.');
    }

    try {
      await this.assignmentsRepository.delete(id);
    } catch (error) {
      this.logger.error(`Error al eliminar la tarea: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al eliminar la tarea.');
    }
  }

  // FIXED: Nuevo método para que los alumnos suban tareas
  async submitAssignment(
    assignmentId: string,
    studentId: string,
    submissionFileUrl: string,
    submissionMessage?: string,
  ): Promise<Submission> {
    this.logger.log(`Estudiante ${studentId} intentando subir entrega para tarea ${assignmentId}.`);

    const assignment = await this.assignmentsRepository.findOne({
      where: { id: assignmentId },
      relations: ['class', 'submissions', 'submissions.student'], 
    });

    if (!assignment) {
      throw new NotFoundException(`Tarea con ID ${assignmentId} no encontrada.`);
    }

    // FIXED: Busca el objeto estudiante completo para verificar roles si es necesario
    const student = await this.usersService.findOneById(studentId);
    if (!student) {
        throw new NotFoundException('Estudiante no encontrado.');
    }

    // Verificar si el estudiante está matriculado en la clase O si es un profesor/admin
    const isEnrolled = await this.classesService.isUserEnrolledInClass(assignment.classId, student.id);
    if (!isEnrolled && !(student.roles?.includes(UserRole.Admin) || student.roles?.includes(UserRole.Profesor))) { 
      throw new ForbiddenException('No tienes permiso para subir entregas a esta tarea.');
    }
    
    // Verificar si ya existe una entrega de este alumno para esta tarea
    let submission = assignment.submissions?.find(sub => sub.studentId === student.id);

    if (submission) {
      // Si ya existe, actualiza la entrega
      submission.submissionFileUrl = submissionFileUrl;
      submission.submissionMessage = submissionMessage;
      this.logger.log(`Actualizando entrega existente para estudiante ${student.id} en tarea ${assignmentId}.`);
    } else {
      // Si no existe, crea una nueva entrega
      submission = this.submissionsRepository.create({
        assignmentId,
        studentId,
        submissionFileUrl,
        submissionMessage,
      });
      this.logger.log(`Creando nueva entrega para estudiante ${student.id} en tarea ${assignmentId}.`);
    }

    try {
      const savedSubmission = await this.submissionsRepository.save(submission);
      return savedSubmission;
    } catch (error) {
      this.logger.error(`Error al guardar la entrega de la tarea: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al procesar la entrega de la tarea.');
    }
  }
}