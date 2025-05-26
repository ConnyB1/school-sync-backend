// proyecto/school-sync-backend/src/announcements/announcements.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Logger,
  ForbiddenException,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User, UserRole } from '../users/user.entity';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { Announcement } from './announcement.entity';

@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  private readonly logger = new Logger(AnnouncementsController.name);

  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get('class/:classId') // Esta ruta debe estar presente y correcta
  async findAllByClass(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Request() req: { user: User },
  ): Promise<Announcement[]> {
    const userId = req.user.id;
    if (!userId) {
      this.logger.warn(`Intento de obtener anuncios de clase ${classId} sin ID de usuario en el token.`);
      throw new ForbiddenException('No se pudo identificar al usuario desde el token.');
    }
    this.logger.log(`Usuario ${userId} solicitando anuncios para la clase: ${classId}`);
    return this.announcementsService.findAllByClass(classId, userId);
  }

  @Post()
  @Roles(UserRole.Profesor, UserRole.Admin)
  @UseGuards(RolesGuard)
  async create(
    @Body() createAnnouncementDto: CreateAnnouncementDto,
    @Request() req: { user: User },
  ): Promise<Announcement> {
    const authorId = req.user.id;
    if (!authorId) {
      this.logger.warn(
        'Intento de crear anuncio sin ID de autor en el token.',
      );
      throw new ForbiddenException(
        'No se pudo identificar al autor desde el token.',
      );
    }
    this.logger.log(
      `Usuario ${authorId} creando anuncio: ${createAnnouncementDto.title}`,
    );
    return this.announcementsService.create(createAnnouncementDto, authorId);
  }

  @Get()
  // No hay necesidad de un @Roles(UserRole.Admin) aquí, ya que findAll() es una ruta general
  async findAll(@Request() req: { user: User }): Promise<Announcement[]> {
    this.logger.log(`Usuario ${req.user.id} solicitando todos los anuncios.`);
    return this.announcementsService.findAll();
  }
}