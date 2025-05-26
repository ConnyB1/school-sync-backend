// proyecto/school-sync-backend/src/announcements/announcements.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UsersService } from '../users/users.service';
import { ClassesService } from '../classes/classes.service';
import { User, UserRole } from '../users/user.entity';
import { Class } from '../classes/class.entity';

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(
    @InjectRepository(Announcement)
    private announcementsRepository: Repository<Announcement>,
    private readonly usersService: UsersService,
    private readonly classesService: ClassesService,
  ) {}

  async findAll(): Promise<Announcement[]> {
    this.logger.log('Obteniendo todos los anuncios.');
    return this.announcementsRepository.find({
      relations: ['class', 'author'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByClass(classId: string, userId: string): Promise<Announcement[]> {
    this.logger.log(`Obteniendo anuncios para la clase ID: ${classId} por usuario ID: ${userId}`);
    
    await this.classesService.findById(classId, userId);

    return this.announcementsRepository.find({
      where: { classId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    createAnnouncementDto: CreateAnnouncementDto,
    authorId: string,
  ): Promise<Announcement> {
    this.logger.log(
      `Usuario con ID ${authorId} intentando crear un anuncio para la clase ID ${createAnnouncementDto.classId}`,
    );

    const author = await this.usersService.findOneById(authorId);

    if (
      !author.roles?.includes(UserRole.Profesor) &&
      !author.roles?.includes(UserRole.Admin)
    ) {
      this.logger.warn(
        `Usuario ${author.email} (ID: ${authorId}) intentó crear un anuncio sin rol de Profesor o admin.`,
      );
      throw new ForbiddenException(
        'Solo los profesores o administradores pueden crear anuncios.',
      );
    }

    const classEntity: Class = await this.classesService.findById(
      createAnnouncementDto.classId,
      authorId,
    );

    if (
      !author.roles?.includes(UserRole.Admin) &&
      classEntity.teacherId !== author.id
    ) {
      this.logger.warn(
        `El profesor ${author.email} (ID: ${authorId}) intentó crear un anuncio en la clase ${classEntity.name} (ID: ${classEntity.id}) pero no es el profesor de dicha clase.`
      );
      throw new ForbiddenException(
        'Solo el profesor de la clase o un administrador pueden crear anuncios para esta clase.',
      );
    }

    const announcementData: Partial<Announcement> = {
      title: createAnnouncementDto.title,
      content: createAnnouncementDto.content,
      class: classEntity,
      classId: classEntity.id,
      author: author as User,
      authorId: author.id,
    };

    if (createAnnouncementDto.imageUrl !== undefined) {
      announcementData.imageUrl = createAnnouncementDto.imageUrl;
    }

    const announcement = this.announcementsRepository.create(announcementData);

    try {
      const savedAnnouncement =
        await this.announcementsRepository.save(announcement);
      this.logger.log(
        `Anuncio creado con ID ${savedAnnouncement.id} por el usuario ${authorId} para la clase ${classEntity.id}.`,
      );
      return savedAnnouncement;
    } catch (error: any) {
      this.logger.error(
        `Error al guardar el anuncio: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Error al crear el anuncio.');
    }
  }

  async findOneById(id: string): Promise<Announcement> {
    this.logger.log(`Buscando anuncio con ID: ${id}`);
    const announcement = await this.announcementsRepository.findOne({
      where: { id },
      relations: ['class', 'author'],
    });
    if (!announcement) {
      this.logger.warn(`Anuncio con ID ${id} no encontrado.`);
      throw new NotFoundException(`Anuncio con ID ${id} no encontrado.`);
    }
    return announcement;
  }
}