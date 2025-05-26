// proyecto/school-sync-backend/src/users/users.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Patch,
  UseInterceptors,
  UploadedFile,
  Get,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { LinkStudentDto } from './dto/link-student.dto';
import { User } from './user.entity';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get('find-by-identifier')
  async findUserByIdentifier(@Query('identifier') identifier: string, @Request() req: { user: User }) {
    this.logger.log(`Usuario ${req.user.id} buscando usuario por identificador: ${identifier}`);
    if (!identifier) {
      throw new BadRequestException('El parámetro "identifier" es requerido.');
    }
    try {
      const user = await this.usersService.findByIdentifier(identifier);
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`Usuario no encontrado con identificador ${identifier}: ${error.message}`);
        throw new NotFoundException(error.message);
      }
      this.logger.error(`Error buscando usuario por identificador ${identifier}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al buscar el usuario.');
    }
  }

  @Post('link-student')
  @HttpCode(HttpStatus.OK)
  async linkStudentToParent(
    @Request() req: { user: User },
    @Body() linkStudentDto: LinkStudentDto,
  ) {
    const parentId = req.user.id;
    const studentId = linkStudentDto.studentId;

    this.logger.log(
      `Intentando vincular alumno ID ${studentId} con padre ID ${parentId}`,
    );
    if (!parentId || !studentId) {
      throw new BadRequestException('IDs de padre y alumno son requeridos.');
    }

    try {
      await this.usersService.linkParentToStudent(parentId, studentId);
      return { message: 'Petición de vinculación de alumno procesada.' };
    } catch (error) {
      this.logger.error(
        `❌ Error en /link-student para padre ${parentId} y alumno ${studentId}: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al procesar la vinculación del alumno.');
    }
  }

  @Patch('profile/update')
  @UseInterceptors(FileInterceptor('profilePicture', {
    storage: diskStorage({
      destination: './uploads/profile-pictures',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new BadRequestException('Solo se permiten archivos de imagen (jpg, jpeg, png, gif).'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 1024 * 1024 * 5 }
  }))
  async updateUserProfile(
    @Request() req: { user: User },
    @Body() updateUserProfileDto: UpdateUserProfileDto,
    @UploadedFile() profilePicture?: Express.Multer.File,
  ) {
    const userId = req.user.id;
    this.logger.log(`Usuario ${userId} (${req.user.email}) actualizando perfil.`);

    const updateData: Partial<User> = { ...updateUserProfileDto };

    if (profilePicture) {
      updateData.pictureUrl = `/uploads/profile-pictures/${profilePicture.filename}`;
      this.logger.log(`Nueva foto de perfil para ${userId}: ${updateData.pictureUrl}`);
    }

    try {
      const updatedUser = await this.usersService.updateUserProfile(userId, updateData);
      return updatedUser;
    } catch (error) {
      this.logger.error(
        `❌ Error actualizando perfil para usuario ${userId}: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el perfil.');
    }
  }
}