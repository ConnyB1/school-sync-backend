import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Announcement } from './announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UsersService } from '../users/users.service';
import { ClassesService } from '../classes/classes.service';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private announcementsRepository: Repository<Announcement>,
    private readonly usersService: UsersService,
    private readonly classesService: ClassesService,
  ) {}
  /*
  async create(createAnnouncementDto: CreateAnnouncementDto, authorAuth0Id: string): Promise<Announcement> {
    const author = await this.usersService.findOneByAuth0Id(authorAuth0Id);
    if (!author) {
      throw new NotFoundException(`Usuario con Auth0 ID ${authorAuth0Id} no encontrado.`);
    }
    
    const classEntity = await this.classesService.findOneByIdWithRelations(createAnnouncementDto.classId);
    if (!classEntity) {
      throw new NotFoundException(`Clase con ID ${createAnnouncementDto.classId} no encontrada.`);
    }

    if (classEntity.teacherId !== author.id) {
      throw new ForbiddenException('Solo el profesor de la clase puede crear anuncios.');
    }

    const announcement = this.announcementsRepository.create({
      ...createAnnouncementDto,
      class: classEntity,
      classId: classEntity.id,
      author: author,
      authorId: author.id,
    });

    return this.announcementsRepository.save(announcement);
  }

  async findAllForUser(userAuth0Id: string): Promise<Announcement[]> {
    const user = await this.usersService.findOneByAuth0IdWithClasses(userAuth0Id);
    if (!user) {
      throw new NotFoundException(`Usuario con Auth0 ID ${userAuth0Id} no encontrado.`);
    }

    if (!user.classes || user.classes.length === 0) {
      return [];
    }

    const classIds = user.classes.map(cls => cls.id);

    return this.announcementsRepository.find({
      where: { classId: In(classIds) },
      relations: ['class', 'author'],
      order: { createdAt: 'DESC' },
    });
  }
  
  async findAllByClass(classId: string, userAuth0Id: string): Promise<Announcement[]> {
    const classEntity = await this.classesService.findOneByIdWithRelations(classId);
    if (!classEntity) {
      throw new NotFoundException(`Clase con ID ${classId} no encontrada.`);
    }

    const user = await this.usersService.findOneByAuth0Id(userAuth0Id);
    if (!user) {
      throw new NotFoundException(`Usuario ${userAuth0Id} no encontrado.`);
    }

    const isTeacher = classEntity.teacherId === user.id;
    const isStudentInClass = user.classes && user.classes.some(cls => cls.id === classId);

    if (!isTeacher && !isStudentInClass) {
      throw new ForbiddenException('No tienes permiso para ver los anuncios de esta clase.');
    }

    return this.announcementsRepository.find({
      where: { classId: classId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }*/
}
