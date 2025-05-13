// proyecto/school-sync-backend/src/classes/classes.controller.ts
import {
  Controller, Post, Body, UseGuards, Request, Get, Param,
  UploadedFile, UseInterceptors, ParseFilePipe, FileTypeValidator, MaxFileSizeValidator,
  ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { JoinClassDto } from './dto/join-class.dto';
import { Class } from './class.entity';

@Controller('classes')
@UseGuards(JwtAuthGuard) // Proteger todas las rutas de este controlador
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  async create(@Body() createClassDto: CreateClassDto, @Request() req): Promise<Class> {
    // req.user.auth0UserId debería estar disponible gracias a JwtStrategy
    const teacherAuth0Id = req.user.auth0UserId;
    return this.classesService.create(createClassDto, teacherAuth0Id);
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  async join(@Body() joinClassDto: JoinClassDto, @Request() req): Promise<Class> {
    const studentAuth0Id = req.user.auth0UserId;
    return this.classesService.joinClass(joinClassDto, studentAuth0Id);
  }

  @Get() // Obtener todas las clases para el usuario (maestro o alumno)
  async findAllForUser(@Request() req): Promise<Class[]> {
    const userAuth0Id = req.user.auth0UserId;
    return this.classesService.findAllForUser(userAuth0Id);
  }

  @Get(':id') // Obtener una clase específica por ID
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req): Promise<Class> {
    const userAuth0Id = req.user.auth0UserId;
    return this.classesService.findById(id, userAuth0Id);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file')) 
  async importClasses(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), // .xlsx
        ],
      }),
    ) file: Express.Multer.File,
    @Request() req
  ) {
    const userAuth0Id = req.user.auth0UserId;
    return this.classesService.importClassesFromExcel(file.buffer, userAuth0Id);
  }
}