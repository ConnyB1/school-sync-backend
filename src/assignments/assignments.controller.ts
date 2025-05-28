// proyecto/school-sync-backend/src/assignments/assignments.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Patch,
  Delete,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseUUIDPipe,
  ForbiddenException,
  BadRequestException,
  Logger,
  Query,
  HttpCode,
  HttpStatus,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User, UserRole } from '../users/user.entity';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { Assignment } from './assignment.entity';
import { Submission } from './submission.entity';
import { Response } from 'express';
import { join } from 'path';

@Controller('assignments')
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
  private readonly logger = new Logger(AssignmentsController.name);

  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @Roles(UserRole.Profesor, UserRole.Admin)
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file')) // El nombre del campo del archivo debe ser 'file'
  async create(
    @Body() createAssignmentDto: CreateAssignmentDto,
    @Request() req: { user: User },
    @UploadedFile() file?: Express.Multer.File, // Marcar como opcional si no siempre se sube
  ): Promise<Assignment> {
    const teacherId = req.user.id;
    if (!teacherId) {
      this.logger.warn(
        'Intento de crear tarea sin ID de profesor en el token.',
      );
      throw new ForbiddenException(
        'No se pudo identificar al profesor desde el token.',
      );
    }
    this.logger.log(
      `Usuario ${teacherId} creando tarea: ${createAssignmentDto.title}`,
    );

    // Asegurarse de que createAssignmentDto.assignmentFileUrl se establece si se envía en el DTO (no por el archivo)
    // El archivo se maneja directamente por el servicio
    return this.assignmentsService.createAssignment(
      createAssignmentDto,
      teacherId,
      file, // Pasa el objeto de archivo completo al servicio
    );
  }

  @Get()
  async findAll(@Request() req: { user: User }): Promise<Assignment[]> {
    const userId = req.user.id;
    if (!userId) {
      this.logger.warn(
        'Intento de obtener tareas sin ID de usuario en el token.',
      );
      throw new ForbiddenException(
        'No se pudo identificar al usuario desde el token.',
      );
    }
    this.logger.log(`Usuario ${userId} solicitando todas sus tareas.`);
    return this.assignmentsService.findAllAssignments(userId);
  }

  @Get('class/:classId')
  async findAllByClassId(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Request() req: { user: User },
  ): Promise<Assignment[]> {
    const userId = req.user.id;
    if (!userId) {
      this.logger.warn(
        `Intento de obtener tareas para clase ${classId} sin ID de usuario en el token.`,
      );
      throw new ForbiddenException(
        'No se pudo identificar al usuario desde el token.',
      );
    }
    this.logger.log(
      `Usuario ${userId} solicitando tareas para la clase: ${classId}.`,
    );
    return this.assignmentsService.findAllByClassId(classId, userId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) assignmentId: string,
    @Request() req: { user: User },
  ): Promise<Assignment> {
    const userId = req.user.id;
    if (!userId) {
      this.logger.warn(
        `Intento de obtener tarea ${assignmentId} sin ID de usuario en el token.`,
      );
      throw new ForbiddenException(
        'No se pudo identificar al usuario desde el token.',
      );
    }
    this.logger.log(
      `Usuario ${userId} solicitando detalles de la tarea: ${assignmentId}.`,
    );
    return this.assignmentsService.findOneAssignment(assignmentId, userId);
  }

  @Patch(':id')
  @Roles(UserRole.Profesor, UserRole.Admin)
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file')) // El nombre del campo del archivo debe ser 'file'
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
    @Request() req: { user: User },
    @UploadedFile() file?: Express.Multer.File, // Marcar como opcional
  ): Promise<Assignment> {
    const teacherId = req.user.id;
    if (!teacherId) {
      throw new ForbiddenException('No se pudo identificar al profesor desde el token.');
    }
    this.logger.log(`Profesor ${teacherId} actualizando tarea: ${id}`);
    return this.assignmentsService.updateAssignment(id, updateAssignmentDto, teacherId, file); // Pasa el archivo
  }

  @Delete(':id')
  @Roles(UserRole.Profesor, UserRole.Admin)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: User },
  ): Promise<void> {
    const teacherId = req.user.id;
    if (!teacherId) {
      throw new ForbiddenException('No se pudo identificar al profesor desde el token.');
    }
    this.logger.log(`Profesor ${teacherId} eliminando tarea: ${id}`);
    await this.assignmentsService.removeAssignment(id, teacherId);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file')) // El nombre del campo del archivo debe ser 'file'
  async submitAssignment(
    @Param('id', ParseUUIDPipe) assignmentId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /(application\/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document|vnd.ms-excel|vnd.openxmlformats-officedocument.spreadsheetml.document)|image\/(jpeg|png|gif)|text\/plain)/ }),
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }), // 10MB
        ],
      }),
    )
    file: Express.Multer.File,
    @Request() req: { user: User },
  ) {
    const studentId = req.user.id;
    if (!studentId) {
      this.logger.warn('Intento de subir tarea sin ID de alumno en el token.');
      throw new ForbiddenException('No se pudo identificar al alumno desde el token.');
    }
    
    this.logger.log(`Received file object for submission: ${JSON.stringify(file ? { originalname: file.originalname, mimetype: file.mimetype, size: file.size } : 'No file', null, 2)}`);

    if (!file) {
      this.logger.error('Error en submitAssignment: Archivo no proporcionado después de la validación.');
      throw new BadRequestException('Archivo de entrega no proporcionado o inválido.');
    }

    this.logger.log(
      `Alumno ${studentId} subiendo archivo para tarea ${assignmentId}: ${file.originalname}`,
    );
    return this.assignmentsService.submitAssignment(assignmentId, studentId, file);
  }

  @Get(':id/submissions')
  @Roles(UserRole.Profesor, UserRole.Admin)
  @UseGuards(RolesGuard)
  async getSubmissionsForAssignment(
    @Param('id', ParseUUIDPipe) assignmentId: string,
    @Request() req: { user: User },
  ): Promise<Submission[]> {
    const userId = req.user.id;
    if (!userId) {
      throw new ForbiddenException('No se pudo identificar al usuario desde el token.');
    }
    this.logger.log(`Profesor/Admin ${userId} solicitando entregas para tarea ${assignmentId}.`);
    return this.assignmentsService.getSubmissionsForAssignment(assignmentId);
  }

  @Get('my-submissions/assignment/:assignmentId')
  async getMySubmissionForAssignment(
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Request() req: { user: User },
  ): Promise<Submission> {
    const studentId = req.user.id;
    if (!studentId) {
      throw new ForbiddenException('No se pudo identificar al alumno desde el token.');
    }
    this.logger.log(`Alumno ${studentId} solicitando su entrega para tarea ${assignmentId}.`);
    return this.assignmentsService.getMySubmissionForAssignment(assignmentId, studentId);
  }

  @Patch('submissions/:submissionId/grade')
  @Roles(UserRole.Profesor, UserRole.Admin)
  @UseGuards(RolesGuard)
  async gradeSubmission(
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @Body('grade') grade: number,
    @Body('feedback') feedback: string,
    @Request() req: { user: User },
  ): Promise<Submission> {
    const teacherId = req.user.id;
    if (!teacherId) {
      throw new ForbiddenException('No se pudo identificar al profesor desde el token.');
    }
    if (typeof grade !== 'number' || grade < 1 || grade > 100) {
      throw new BadRequestException('La calificación debe ser un número entre 1 y 100.');
    }
    this.logger.log(`Profesor ${teacherId} calificando entrega ${submissionId} con ${grade}.`);
    return this.assignmentsService.gradeSubmission(submissionId, grade, feedback, teacherId);
  }

  @Get('uploads/:folder/:filename')
  seeUploadedFile(@Param('folder') folder: string, @Param('filename') filename: string, @Res() res: Response) {
    if (!['assignments', 'submissions'].includes(folder)) {
      throw new BadRequestException('Carpeta de archivos no válida.');
    }
    const filePath = join(process.cwd(), 'uploads', folder, filename);
    this.logger.log(`Sirviendo archivo desde: ${filePath}`);
    try {
      return res.sendFile(filePath);
    } catch (error) {
      this.logger.error(`Error al servir el archivo ${filePath}: ${error.message}`);
      throw new NotFoundException('Archivo no encontrado.');
    }
  }
}