// proyecto/school-sync-backend/src/assignments/assignments.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    ParseUUIDPipe,
    Logger,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    ForbiddenException,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { diskStorage } from 'multer';
  import { extname } from 'path';
  
  import { AssignmentsService } from './assignments.service';
  import { CreateAssignmentDto } from './dto/create-assignment.dto';
  import { UpdateAssignmentDto } from './dto/update-assignment.dto';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { RolesGuard } from '../auth/roles.guard';
  import { Roles } from '../auth/roles.decorator';
  import { User, UserRole } from '../users/user.entity';
  import { Assignment } from './assignment.entity';
  
  @Controller('assignments')
  @UseGuards(JwtAuthGuard)
  export class AssignmentsController {
    private readonly logger = new Logger(AssignmentsController.name);

    constructor(private readonly assignmentsService: AssignmentsService) {}
  
    @Get('class/:classId') 
    async findAllByClass(
      @Param('classId', ParseUUIDPipe) classId: string,
      @Request() req: { user: User }
    ): Promise<Assignment[]> {
      this.logger.log(`Usuario ${req.user.id} solicitando tareas para clase ${classId}.`);
      return this.assignmentsService.findAllByClass(classId, req.user);
    }

    @Get(':id/class/:classId') 
    async findOne(
      @Param('id', ParseUUIDPipe) id: string,
      @Param('classId', ParseUUIDPipe) classId: string,
      @Request() req: { user: User }
    ): Promise<Assignment> {
      this.logger.log(`Usuario ${req.user.id} solicitando tarea ${id} de clase ${classId}.`);
      return this.assignmentsService.findOne(id, classId, req.user);
    }

    @Post()
    @Roles(UserRole.Profesor, UserRole.Admin)
    @UseGuards(RolesGuard)
    @UseInterceptors(FileInterceptor('file', { 
      storage: diskStorage({
        destination: './uploads/assignments', 
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf|doc|docx|txt|jpg|jpeg|png)$/i)) {
          return cb(new BadRequestException('Solo se permiten archivos de documento o imagen.'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 1024 * 1024 * 10 } 
    }))
    async create(
      @Body() createAssignmentDto: CreateAssignmentDto,
      @UploadedFile() file: Express.Multer.File, 
      @Request() req: { user: User }
    ): Promise<Assignment> {
      this.logger.log(`Usuario ${req.user.id} creando tarea.`);
      if (file) {
        (createAssignmentDto as any).assignmentFileUrl = `/uploads/assignments/${file.filename}`;
      }
      return this.assignmentsService.create(createAssignmentDto, req.user);
    }
  
    @Patch(':id') // Para que el profesor edite detalles de la tarea
    @Roles(UserRole.Profesor, UserRole.Admin)
    @UseGuards(RolesGuard)
    @UseInterceptors(FileInterceptor('file', { 
      storage: diskStorage({
        destination: './uploads/assignments',
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf|doc|docx|txt|jpg|jpeg|png)$/i)) {
          return cb(new BadRequestException('Solo se permiten archivos de documento o imagen.'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 1024 * 1024 * 10 }
    }))
    async update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() updateAssignmentDto: UpdateAssignmentDto,
      @UploadedFile() file: Express.Multer.File, 
      @Request() req: { user: User }
    ): Promise<Assignment> {
      this.logger.log(`Usuario ${req.user.id} actualizando tarea ${id}.`);
      if (file) {
        (updateAssignmentDto as any).assignmentFileUrl = `/uploads/assignments/${file.filename}`;
      }
      return this.assignmentsService.update(id, updateAssignmentDto, req.user);
    }

    // FIXED: Nuevo endpoint para que los alumnos suban su tarea (entrega)
    @Post(':id/submit') // Endpoint: POST /api/assignments/:id/submit
    @Roles(UserRole.Alumno) // Solo alumnos pueden subir tareas
    @UseGuards(RolesGuard)
    @UseInterceptors(FileInterceptor('submissionFile', { // 'submissionFile' es el nombre del campo en el FormData
      storage: diskStorage({
        destination: './uploads/submissions', // Directorio para las entregas de los alumnos
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Puedes ajustar los tipos de archivo permitidos para las entregas
        if (!file.originalname.match(/\.(pdf|doc|docx|txt|jpg|jpeg|png|zip|rar)$/i)) {
          return cb(new BadRequestException('Solo se permiten archivos de documento o imagen para la entrega.'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 1024 * 1024 * 20 } // Límite de 20MB para entregas
    }))
    async submitAssignment(
      @Param('id', ParseUUIDPipe) assignmentId: string,
      @Body() submissionDto: { message?: string }, // Aquí podrías recibir el mensaje del alumno
      @UploadedFile() file: Express.Multer.File,
      @Request() req: { user: User }
    ): Promise<any> { // Podrías definir un DTO de respuesta más específico
      this.logger.log(`Usuario ${req.user.id} intentando subir/modificar entrega para la tarea ${assignmentId}.`);
      if (!file) {
        throw new BadRequestException('No se adjuntó ningún archivo para la entrega.');
      }
      // Implementa la lógica en el servicio para guardar la entrega.
      // Esto implicaría crear una nueva entidad `Submission` o actualizar una existente.
      // Por ahora, solo logueamos y retornamos un mensaje.
      const submissionFilePath = `/uploads/submissions/${file.filename}`;
      const result = await this.assignmentsService.submitAssignment(
        assignmentId,
        req.user.id,
        submissionFilePath,
        submissionDto.message
      );
      return { message: 'Entrega subida exitosamente.', submission: result };
    }
  
    @Delete(':id')
    @Roles(UserRole.Profesor, UserRole.Admin)
    @UseGuards(RolesGuard)
    async remove(
      @Param('id', ParseUUIDPipe) id: string,
      @Request() req: { user: User }
    ): Promise<void> {
      this.logger.log(`Usuario ${req.user.id} eliminando tarea ${id}.`);
      await this.assignmentsService.remove(id, req.user);
    }
  }