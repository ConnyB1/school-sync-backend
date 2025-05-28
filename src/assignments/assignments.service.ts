// proyecto/school-sync-backend/src/assignments/assignments.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  ForbiddenException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Assignment } from './assignment.entity';
import { User, UserRole } from '../users/user.entity';
import { Class } from '../classes/class.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { Submission } from './submission.entity';
import { UsersService } from '../users/users.service';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import * as fs from 'fs';
import { SendGridService } from '../sendgrid/sendgrid.service';

@Injectable()
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);

  constructor(
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
    @InjectRepository(Submission)
    private submissionsRepository: Repository<Submission>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    @InjectRepository(Class)
    private classesRepository: Repository<Class>,
    private readonly sendgridService: SendGridService,
  ) {}

  private async saveFile(file: Express.Multer.File, folder: string): Promise<string> {
    const uploadDir = join(process.cwd(), 'uploads', folder);
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${uuidv4()}-${file.originalname}`;
    const filePath = join(folder, fileName);
    const fullPath = join(uploadDir, fileName);

    try {
      await writeFile(fullPath, file.buffer);
      this.logger.log(`Archivo guardado en: ${fullPath}`);
      return filePath;
    } catch (error) {
      this.logger.error(`Error al guardar el archivo: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al guardar el archivo.');
    }
  }

  private async deleteFile(filePath: string): Promise<void> {
    const fullPath = join(process.cwd(), 'uploads', filePath);
    try {
      if (fs.existsSync(fullPath)) {
        await unlink(fullPath);
        this.logger.log(`Archivo eliminado: ${fullPath}`);
      }
    } catch (error) {
      this.logger.warn(`No se pudo eliminar el archivo ${fullPath}: ${error.message}`);
    }
  }

  async createAssignment(
    createAssignmentDto: CreateAssignmentDto,
    teacherId: string,
    file?: Express.Multer.File,
  ): Promise<Assignment> {
    this.logger.log(`Creando tarea para clase ID: ${createAssignmentDto.classId} por profesor ID: ${teacherId}`);

    const teacher = await this.usersService.findOneById(teacherId);
    if (!teacher || (!teacher.roles.includes(UserRole.Profesor) && !teacher.roles.includes(UserRole.Admin))) {
      throw new ForbiddenException('Solo los profesores o administradores pueden crear tareas.');
    }

    const classEntity = await this.classesRepository.findOne({
      where: { id: createAssignmentDto.classId },
      relations: ['teacher', 'studentEnrollments', 'studentEnrollments.user'],
    });

    if (!classEntity) {
      throw new NotFoundException(`Clase con ID ${createAssignmentDto.classId} no encontrada.`);
    }

    if (classEntity.teacherId !== teacherId) {
      throw new ForbiddenException('No tienes permiso para crear tareas en esta clase.');
    }

    const newAssignment = this.assignmentsRepository.create({
      ...createAssignmentDto,
      teacher: teacher,
      class: classEntity,
    });

    if (file) {
      newAssignment.assignmentFileUrl = await this.saveFile(file, 'assignments');
    }

    try {
      const savedAssignment = await this.assignmentsRepository.save(newAssignment);
      this.logger.log(`Tarea creada con ID: ${savedAssignment.id}`);

      // --- Envío de correo electrónico para nueva tarea ---
      const studentEmails = classEntity.studentEnrollments
        .map(enrollment => enrollment.user?.email)
        .filter(email => email);

      if (studentEmails.length > 0) {
        const subject = `Nueva Tarea en ${classEntity.name}: ${savedAssignment.title}`;
        // <--- NUEVA CONSTANTE
        const dueDateString = savedAssignment.dueDate
          ? new Date(savedAssignment.dueDate).toLocaleDateString()
          : 'No especificada';
        const text = `
          Hola,

          El profesor ${teacher.firstName} ${teacher.lastName} ha publicado una nueva tarea en la clase "${classEntity.name}":

          Título: ${savedAssignment.title}
          Descripción: ${savedAssignment.description}
          Fecha de Entrega: ${dueDateString} // <--- MODIFICADO

          Por favor, revisa la plataforma SchoolSync para más detalles y para subir tu entrega.

          Saludos,
          El equipo de SchoolSync
        `;
        await this.sendgridService.sendMail({
          to: studentEmails,
          subject: subject,
          text: text,
          html: `<p>Hola,</p>
                <p>El profesor <strong>${teacher.firstName} ${teacher.lastName}</strong> ha publicado una nueva tarea en la clase "<strong>${classEntity.name}</strong>":</p>
                <h3>${savedAssignment.title}</h3>
                <p>${savedAssignment.description}</p>
                <p><strong>Fecha de Entrega:</strong> ${dueDateString}</p> // <--- MODIFICADO
                <p>Por favor, revisa la plataforma SchoolSync para más detalles y para subir tu entrega.</p>
                <p>Saludos,<br/>El equipo de SchoolSync</p>`,
        });
        this.logger.log(`Notificación de nueva tarea enviada a ${studentEmails.length} estudiantes.`);
      } else {
        this.logger.log('No hay estudiantes matriculados en la clase para enviar la notificación de tarea.');
      }
      // ----------------------------------------------------

      return savedAssignment;
    } catch (error) {
      this.logger.error(
        `Error al guardar la nueva tarea o enviar correo: ${error.message}`,
        error.stack,
      );
      if (newAssignment.assignmentFileUrl) {
        await this.deleteFile(newAssignment.assignmentFileUrl);
      }
      throw new InternalServerErrorException('Error al crear la tarea.');
    }
  }

  async findAllAssignments(userId: string): Promise<Assignment[]> {
    const user = await this.usersService.findOneById(userId);

    if (user.roles.includes(UserRole.Profesor) || user.roles.includes(UserRole.Admin)) {
      return this.assignmentsRepository.find({
        where: { teacher: { id: userId } },
        relations: ['class', 'teacher'],
        order: { dueDate: 'ASC' },
      });
    } else if (user.roles.includes(UserRole.Alumno)) {
      const enrolledClasses = await this.classesRepository.find({
        where: { studentEnrollments: { user: { id: userId } } },
        relations: ['assignments', 'assignments.teacher'],
      });
      const assignments = enrolledClasses.flatMap(cls => cls.assignments);
      return assignments;
    }

    return [];
  }

  async findAllByClassId(classId: string, userId: string): Promise<Assignment[]> {
    this.logger.log(`Buscando tareas para clase ID: ${classId} por usuario ID: ${userId}`);

    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const classEntity = await this.classesRepository.findOne({
      where: { id: classId },
      relations: ['teacher', 'studentEnrollments', 'studentEnrollments.user'],
    });

    if (!classEntity) {
      throw new NotFoundException(`Clase con ID ${classId} no encontrada.`);
    }

    const isTeacherOfClass = classEntity.teacher?.id === userId;
    const isAdmin = user.roles.includes(UserRole.Admin);
    const isStudentInClass = classEntity.studentEnrollments.some(enrollment => enrollment.user?.id === userId);

    if (!isTeacherOfClass && !isAdmin && !isStudentInClass) {
      throw new ForbiddenException('No tienes permiso para ver las tareas de esta clase.');
    }

    return this.assignmentsRepository.find({
      where: { class: { id: classId } },
      relations: ['teacher', 'class'],
      order: { dueDate: 'ASC' },
    });
  }

  async findOneAssignment(assignmentId: string, userId: string): Promise<Assignment> {
    this.logger.log(`Buscando tarea ID: ${assignmentId} para usuario ID: ${userId}`);

    const assignment = await this.assignmentsRepository.findOne({
      where: { id: assignmentId },
      relations: ['class', 'teacher', 'class.studentEnrollments', 'class.studentEnrollments.user'],
    });

    if (!assignment) {
      throw new NotFoundException(`Tarea con ID ${assignmentId} no encontrada.`);
    }

    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const isTeacherOfAssignment = assignment.teacher?.id === userId;
    const isAdmin = user.roles.includes(UserRole.Admin);
    const isStudentInClass = assignment.class.studentEnrollments.some(enrollment => enrollment.user?.id === userId);

    if (!isTeacherOfAssignment && !isAdmin && !isStudentInClass) {
      throw new ForbiddenException('No tienes permiso para acceder a esta tarea.');
    }

    return assignment;
  }

  async updateAssignment(
    id: string,
    updateAssignmentDto: UpdateAssignmentDto,
    teacherId: string,
    file?: Express.Multer.File,
  ): Promise<Assignment> {
    const assignment = await this.assignmentsRepository.findOne({
      where: { id },
      relations: ['teacher'],
    });

    if (!assignment) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada.`);
    }

    if (assignment.teacher?.id !== teacherId) {
      throw new ForbiddenException('No tienes permiso para actualizar esta tarea.');
    }

    if (file) {
      if (assignment.assignmentFileUrl) {
        await this.deleteFile(assignment.assignmentFileUrl);
      }
      assignment.assignmentFileUrl = await this.saveFile(file, 'assignments');
    } else if (updateAssignmentDto.assignmentFileUrl === null) {
      if (assignment.assignmentFileUrl) {
        await this.deleteFile(assignment.assignmentFileUrl);
        assignment.assignmentFileUrl = null; 
      }
    }

    Object.assign(assignment, updateAssignmentDto);
    return this.assignmentsRepository.save(assignment);
  }

  async removeAssignment(id: string, teacherId: string): Promise<void> {
    const assignment = await this.assignmentsRepository.findOne({
      where: { id },
      relations: ['teacher'],
    });

    if (!assignment) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada.`);
    }

    if (assignment.teacher?.id !== teacherId) {
      throw new ForbiddenException('No tienes permiso para eliminar esta tarea.');
    }

    if (assignment.assignmentFileUrl) {
      await this.deleteFile(assignment.assignmentFileUrl);
    }

    await this.assignmentsRepository.remove(assignment);
  }

  async submitAssignment(
    assignmentId: string,
    studentId: string,
    file: Express.Multer.File,
  ): Promise<Submission> {
    this.logger.log(`Procesando submission para tarea ${assignmentId} por alumno ${studentId}`);

    const assignment = await this.assignmentsRepository.findOne({
      where: { id: assignmentId },
      relations: ['class', 'class.studentEnrollments', 'class.studentEnrollments.user', 'teacher'],
    });
    if (!assignment) {
      throw new NotFoundException(`Tarea con ID ${assignmentId} no encontrada.`);
    }

    const student = await this.usersService.findOneById(studentId);
    if (!student || (!student.roles.includes(UserRole.Alumno) && !student.roles.includes(UserRole.Admin))) {
      throw new ForbiddenException('Solo los alumnos o administradores pueden subir tareas.');
    }

    const isEnrolled = assignment.class.studentEnrollments.some(enrollment => enrollment.user?.id === studentId);
    if (!isEnrolled) {
      throw new ForbiddenException('El alumno no está inscrito en la clase de esta tarea.');
    }

    let submission = await this.submissionsRepository.findOne({
      where: { assignment: { id: assignmentId }, student: { id: studentId } },
    });

    const newFilePath = await this.saveFile(file, 'submissions');

    if (submission) {
      if (submission.filePath) {
        await this.deleteFile(submission.filePath);
      }
      submission.filePath = newFilePath;
      submission.submissionDate = new Date();
      submission.grade = null; 
      submission.feedback = null; 
    } else {
      submission = this.submissionsRepository.create({
        assignment: assignment,
        student: student,
        filePath: newFilePath,
        submissionDate: new Date(),
      });
    }

    try {
      const savedSubmission = await this.submissionsRepository.save(submission);
      this.logger.log(`Entrega de tarea ${assignmentId} por alumno ${studentId} guardada/actualizada.`);

      // --- Envío de correo electrónico para entrega de tarea ---
      const teacherEmail = assignment.teacher?.email; 
      if (teacherEmail) {
        const subject = `Nueva Entrega de Tarea: "${assignment.title}" en ${assignment.class.name}`;
        // <--- NUEVA CONSTANTE
        const submissionDateString = savedSubmission.submissionDate
          ? new Date(savedSubmission.submissionDate).toLocaleDateString()
          : 'No disponible';
        const text = `
          Hola ${assignment.teacher?.firstName},

          El alumno ${student.firstName} ${student.lastName} ha ${submission.id ? 'actualizado' : 'entregado'} una tarea en tu clase "${assignment.class.name}":

          Tarea: ${assignment.title}
          Fecha de Entrega: ${submissionDateString} // <--- MODIFICADO

          Por favor, revisa la plataforma SchoolSync para calificar la entrega.

          Saludos,
          El equipo de SchoolSync
        `;
        await this.sendgridService.sendMail({
          to: teacherEmail,
          subject: subject,
          text: text,
          html: `<p>Hola <strong>${assignment.teacher?.firstName}</strong>,</p>
                <p>El alumno <strong>${student.firstName} ${student.lastName}</strong> ha ${submission.id ? 'actualizado' : 'entregado'} una tarea en tu clase "<strong>${assignment.class.name}</strong>":</p>
                <h3>${assignment.title}</h3>
                <p><strong>Fecha de Entrega:</strong> ${submissionDateString}</p> // <--- MODIFICADO
                <p>Por favor, revisa la plataforma SchoolSync para calificar la entrega.</p>
                <p>Saludos,<br/>El equipo de SchoolSync</p>`,
        });
        this.logger.log(`Notificación de entrega de tarea enviada al profesor ${teacherEmail}.`);
      } else {
        this.logger.warn('No se encontró el correo electrónico del profesor para enviar la notificación de entrega de tarea.');
      }
      // ----------------------------------------------------

      return savedSubmission;
    } catch (error) {
      this.logger.error(`Error al guardar la entrega de tarea o enviar correo: ${error.message}`, error.stack);
      await this.deleteFile(newFilePath);
      throw new InternalServerErrorException('Error al guardar la entrega de la tarea.');
    }
  }

  async getSubmissionsForAssignment(assignmentId: string): Promise<Submission[]> {
    this.logger.log(`Obteniendo entregas para la tarea ID: ${assignmentId}`);
    const submissions = await this.submissionsRepository.find({
      where: { assignment: { id: assignmentId } },
      relations: ['student', 'assignment'],
    });
    return submissions;
  }

  async getMySubmissionForAssignment(assignmentId: string, studentId: string): Promise<Submission> {
    this.logger.log(`Obteniendo entrega de alumno ${studentId} para tarea ${assignmentId}`);
    const submission = await this.submissionsRepository.findOne({
      where: { assignment: { id: assignmentId }, student: { id: studentId } },
      relations: ['assignment', 'student'],
    });

    if (!submission) {
      throw new NotFoundException('No se encontró una entrega para esta tarea y alumno.');
    }
    return submission;
  }

  async gradeSubmission(
    submissionId: string,
    grade: number,
    feedback: string,
    teacherId: string,
  ): Promise<Submission> {
    this.logger.log(`Calificando entrega ${submissionId} por profesor ${teacherId}`);

    const submission = await this.submissionsRepository.findOne({
      where: { id: submissionId },
      relations: ['assignment', 'assignment.teacher'],
    });

    if (!submission) {
      throw new NotFoundException(`Entrega con ID ${submissionId} no encontrada.`);
    }

    const teacher = await this.usersService.findOneById(teacherId);
    if (!teacher || (submission.assignment?.teacher?.id !== teacherId && !teacher.roles.includes(UserRole.Admin))) {
      throw new ForbiddenException('No tienes permiso para calificar esta entrega.');
    }

    submission.grade = grade;
    submission.feedback = feedback;

    try {
      return await this.submissionsRepository.save(submission);
    } catch (error) {
      this.logger.error(`Error al guardar la calificación de la entrega: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al calificar la entrega.');
    }
  }
}