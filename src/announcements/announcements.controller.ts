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
// ... otros imports ...
import { User, UserRole } from '../users/user.entity'; // Asegúrate que UserRole esté aquí o importado
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { Announcement } from './announcement.entity';
import { RolesGuard } from '@app/auth/roles.guard';
import { Roles } from '@app/auth/roles.decorator';
import { AnnouncementsService } from './announcements.service';

@Controller('announcements')
@UseGuards(JwtAuthGuard) // Protege todas las rutas del controlador
export class AnnouncementsController {
  private readonly logger = new Logger(AnnouncementsController.name);

  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get() // Endpoint general para anuncios (ahora filtrados por usuario)
  async findAll(@Request() req: { user: User }): Promise<Announcement[]> {
    const userId = req.user.id; // El JwtAuthGuard añade 'user' al request
    if (!userId) {
      // Aunque JwtAuthGuard debería prevenir esto, es una buena doble verificación.
      this.logger.warn(`Intento de obtener anuncios sin ID de usuario en el token.`);
      throw new ForbiddenException('No se pudo identificar al usuario desde el token.');
    }
    this.logger.log(`Usuario ${userId} solicitando sus anuncios.`);
    return this.announcementsService.findAll(userId); // <--- Pasar userId al servicio
  }

  @Get('class/:classId') // Endpoint para anuncios de una clase específica
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
  @Roles(UserRole.Profesor, UserRole.Admin) // Roles decorator ya existe en tu código
  @UseGuards(RolesGuard) // RolesGuard ya existe en tu código
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
}