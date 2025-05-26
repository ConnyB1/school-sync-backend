// proyecto/school-sync-backend/src/classes/classes.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User, UserRole } from '../users/user.entity';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { JoinClassDto } from './dto/join-class.dto';
import { Class } from './class.entity';

@Controller('classes')
@UseGuards(JwtAuthGuard)
export class ClassesController {
  private readonly logger = new Logger(ClassesController.name);

  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles(UserRole.Profesor, UserRole.Admin)
  @UseGuards(RolesGuard)
  async create(
    @Body() createClassDto: CreateClassDto,
    @Request() req: { user: User },
  ): Promise<Class> {
    const teacherId = req.user.id;
    if (!teacherId) {
      this.logger.warn(
        'Intento de crear clase sin ID de profesor en el token.',
      );
      throw new ForbiddenException(
        'No se pudo identificar al profesor desde el token.',
      );
    }
    this.logger.log(
      `Usuario ${teacherId} creando clase: ${createClassDto.name}`,
    );
    return this.classesService.create(createClassDto, teacherId);
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  async join(
    @Body() joinClassDto: JoinClassDto,
    @Request() req: { user: User },
  ): Promise<Class> {
    const studentId = req.user.id;
    if (!studentId) {
      this.logger.warn(
        'Intento de unirse a clase sin ID de alumno en el token.',
      );
      throw new ForbiddenException(
        'No se pudo identificar al alumno desde el token.',
      );
    }
    this.logger.log(
      `Alumno ${studentId} intentando unirse a clase con código: ${joinClassDto.classCode}`,
    );
    return this.classesService.joinClass(joinClassDto, studentId);
  }

  @Get()
  async findAllForUser(
    @Request() req: { user: User },
  ): Promise<Class[]> {
    const userId = req.user.id;
    if (!userId) {
      this.logger.warn(
        'Intento de obtener clases sin ID de usuario en el token.',
      );
      throw new ForbiddenException(
        'No se pudo identificar al usuario desde el token.',
      );
    }
    this.logger.log(`Usuario ${userId} solicitando todas sus clases.`);
    return this.classesService.findAllForUser(userId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) classId: string,
    @Request() req: { user: User },
  ): Promise<Class> {
    const userId = req.user.id;
    if (!userId) {
      this.logger.warn(
        `Intento de obtener clase ${classId} sin ID de usuario en el token.`,
      );
      throw new ForbiddenException(
        'No se pudo identificar al usuario desde el token.',
      );
    }
    this.logger.log(
      `Usuario ${userId} solicitando detalles de la clase: ${classId}.`,
    );
    return this.classesService.findById(classId, userId);
  }

  @Get(':id/members') // Ruta esperada: /api/classes/:id/members
  async findClassMembers(
    @Param('id', ParseUUIDPipe) classId: string,
    @Request() req: { user: User },
  ): Promise<{ teachers: User[]; students: User[] }> {
    const userId = req.user.id;
    if (!userId) {
      throw new ForbiddenException('No se pudo identificar al usuario desde el token.');
    }
    return this.classesService.findClassMembers(classId);
  }


  @Post('import')
  @Roles(UserRole.Profesor, UserRole.Admin)
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  async importClasses(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Request() req: { user: User },
  ) {
    const uploaderId = req.user.id;
    if (!uploaderId) {
      this.logger.warn(
        'Intento de importar clases sin ID de cargador en el token.',
      );
      throw new ForbiddenException(
        'No se pudo identificar al cargador desde el token.',
      );
    }

    if (!file || !file.buffer) {
      this.logger.error(
        'Error en importClasses: Archivo no proporcionado o está vacío después de ParseFilePipe.',
      );
      throw new BadRequestException('Archivo no proporcionado o está vacío.');
    }
    this.logger.log(
      `Usuario ${uploaderId} importando clases desde archivo: ${file.originalname}`,
    );
    return this.classesService.importClassesFromExcel(file.buffer, uploaderId);
  }
}