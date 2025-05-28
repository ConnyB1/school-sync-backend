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
import { Repository, In } from 'typeorm'; // Asegúrate de importar In
import { Announcement } from './announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UsersService } from '../users/users.service';
import { ClassesService } from '../classes/classes.service';
import { User, UserRole } from '../users/user.entity'; // Asegúrate que UserRole esté aquí o importado
import { Class } from '../classes/class.entity'; // Asegúrate que Class esté aquí o importado
import { SendGridService } from '../sendgrid/sendgrid.service';

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(
    @InjectRepository(Announcement)
    private announcementsRepository: Repository<Announcement>,
    private readonly usersService: UsersService,
    private readonly classesService: ClassesService,
    private readonly sendgridService: SendGridService,
  ) {}

  async findAll(userId: string): Promise<Announcement[]> {
    this.logger.log(`Obteniendo anuncios para el usuario ID: ${userId}`);

    const user = await this.usersService.findOneByIdWithRelations(userId, [
      'enrollments',
      'enrollments.class', // Para acceder al class.id directamente desde ClassEnrollment
      'taughtClasses',
    ]);

    if (!user) {
      // findOneByIdWithRelations debería arrojar NotFoundException, pero por si acaso:
      this.logger.warn(`Usuario con ID ${userId} no encontrado al intentar obtener sus anuncios.`);
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado.`);
    }

    const relevantClassIds: string[] = [];

    if (user.enrollments && user.enrollments.length > 0) {
      user.enrollments.forEach(enrollment => {
        // Asegurarse de que enrollment.class y enrollment.class.id existen
        if (enrollment.class && enrollment.class.id) {
          relevantClassIds.push(enrollment.class.id);
        } else if (enrollment.classId) { // Fallback por si class no está completamente cargada pero classId sí
            this.logger.debug(`Enrollment ${enrollment.id} para usuario ${userId} tiene classId ${enrollment.classId} pero class no está cargada completamente.`);
            relevantClassIds.push(enrollment.classId);
        } else {
            this.logger.warn(`Enrollment ${enrollment.id} para usuario ${userId} no tiene classId o class cargada.`);
        }
      });
    }

    if (user.taughtClasses && user.taughtClasses.length > 0) {
      user.taughtClasses.forEach(taughtClass => {
        relevantClassIds.push(taughtClass.id);
      });
    }

    const uniqueRelevantClassIds = [...new Set(relevantClassIds)];

    if (uniqueRelevantClassIds.length === 0) {
      this.logger.log(`Usuario ${userId} no está asociado a ninguna clase. No se devolverán anuncios.`);
      return [];
    }

    this.logger.log(`Clases relevantes para el usuario ${userId}: ${uniqueRelevantClassIds.join(', ')}`);

    return this.announcementsRepository.find({
      where: { classId: In(uniqueRelevantClassIds) },
      relations: ['class', 'author'], // Cargar relaciones para mostrar en el frontend
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByClass(classId: string, userId: string): Promise<Announcement[]> {
    this.logger.log(`Obteniendo anuncios para la clase ID: ${classId} por usuario ID: ${userId}`);
    
    // classesService.findById ya debería verificar el acceso del usuario a la clase
    await this.classesService.findById(classId, userId);

    return this.announcementsRepository.find({
      where: { classId },
      relations: ['author'], // En este contexto, 'class' ya es conocida
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
    if (!author) {
        // Esto no debería ocurrir si el token es válido y el usuario existe
        throw new NotFoundException(`Autor con ID ${authorId} no encontrado.`);
    }


    if (
      !author.roles?.includes(UserRole.Profesor) &&
      !author.roles?.includes(UserRole.Admin)
    ) {
      this.logger.warn(
        `Usuario ${author.email} (ID: ${authorId}) intentó crear un anuncio sin rol de Profesor o Admin.`,
      );
      throw new ForbiddenException(
        'Solo los profesores o administradores pueden crear anuncios.',
      );
    }

    const classEntity: Class = await this.classesService.findById(
      createAnnouncementDto.classId,
      authorId, 
      ['studentEnrollments', 'studentEnrollments.user', 'teacher'] // Cargar relaciones para validación y notificación
    );

    // Verificación adicional: si es profesor, debe ser el profesor de LA clase. Admins pueden crear en cualquier clase.
    if (
      author.roles.includes(UserRole.Profesor) &&
      !author.roles.includes(UserRole.Admin) && // Si es solo profesor (no admin)
      classEntity.teacherId !== author.id
    ) {
      this.logger.warn(
        `El profesor ${author.email} (ID: ${authorId}) intentó crear un anuncio en la clase ${classEntity.name} (ID: ${classEntity.id}) pero no es el profesor de dicha clase.`,
      );
      throw new ForbiddenException(
        'Solo el profesor asignado a la clase o un administrador pueden crear anuncios para esta clase.',
      );
    }

    const announcementData: Partial<Announcement> = {
      title: createAnnouncementDto.title,
      content: createAnnouncementDto.content,
      class: classEntity, // classEntity ya está cargada
      classId: classEntity.id,
      author: author, // author ya está cargado
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

      // --- Envío de correo electrónico para nuevo anuncio ---
      const studentEmails = classEntity.studentEnrollments
        ?.map(enrollment => enrollment.user?.email)
        .filter((email): email is string => !!email); // Filtra nulos/undefined y asegura que es string

      if (studentEmails && studentEmails.length > 0) {
        const subject = `Nuevo Anuncio en ${classEntity.name}: ${savedAnnouncement.title}`;
        // Usar el nombre del autor del anuncio, que es el profesor que lo creó o un admin
        const authorFullName = `${author.firstName || ''} ${author.lastName || ''}`.trim() || 'El profesorado';
        
        const text = `
          Hola,

          ${authorFullName} ha publicado un nuevo anuncio en la clase "${classEntity.name}":

          Título: ${savedAnnouncement.title}
          Contenido: ${savedAnnouncement.content}

          Por favor, revisa la plataforma SchoolSync para más detalles.

          Saludos,
          El equipo de SchoolSync
        `;
        const html = `<p>Hola,</p>
                <p><strong>${authorFullName}</strong> ha publicado un nuevo anuncio en la clase "<strong>${classEntity.name}</strong>":</p>
                <h3>${savedAnnouncement.title}</h3>
                <p>${savedAnnouncement.content.replace(/\n/g, '<br />')}</p> ${savedAnnouncement.imageUrl ? `<p><img src="${savedAnnouncement.imageUrl}" alt="Imagen del anuncio" style="max-width: 100%; height: auto;" /></p>` : ''}
                <p>Por favor, revisa la plataforma SchoolSync para más detalles.</p>
                <p>Saludos,<br/>El equipo de SchoolSync</p>`;
        
        try {
            await this.sendgridService.sendMail({
              to: studentEmails,
              subject: subject,
              text: text,
              html: html,
            });
            this.logger.log(`Notificación de nuevo anuncio enviada a ${studentEmails.length} estudiantes.`);
        } catch (emailError) {
            this.logger.error(`Error al enviar correo de notificación de anuncio: ${emailError.message}`, emailError.stack);
            // No relanzar el error para que la creación del anuncio no falle si el email falla
        }
      } else {
        this.logger.log('No hay estudiantes matriculados (con email válido) en la clase para enviar el anuncio.');
      }
      // ----------------------------------------------------

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
      relations: ['class', 'author'], // Cargar relaciones
    });
    if (!announcement) {
      this.logger.warn(`Anuncio con ID ${id} no encontrado.`);
      throw new NotFoundException(`Anuncio con ID ${id} no encontrado.`);
    }
    return announcement;
  }
}