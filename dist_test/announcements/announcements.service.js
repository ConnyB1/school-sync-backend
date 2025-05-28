"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AnnouncementsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnouncementsService = void 0;
// proyecto/school-sync-backend/src/announcements/announcements.service.ts
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const announcement_entity_1 = require("./announcement.entity");
const users_service_1 = require("../users/users.service");
const classes_service_1 = require("../classes/classes.service");
const user_entity_1 = require("../users/user.entity");
const sendgrid_service_1 = require("../sendgrid/sendgrid.service"); // <--- AGREGADO
let AnnouncementsService = AnnouncementsService_1 = class AnnouncementsService {
    announcementsRepository;
    usersService;
    classesService;
    sendgridService;
    logger = new common_1.Logger(AnnouncementsService_1.name);
    constructor(announcementsRepository, usersService, classesService, sendgridService) {
        this.announcementsRepository = announcementsRepository;
        this.usersService = usersService;
        this.classesService = classesService;
        this.sendgridService = sendgridService;
    }
    async findAll() {
        this.logger.log('Obteniendo todos los anuncios.');
        return this.announcementsRepository.find({
            relations: ['class', 'author'],
            order: { createdAt: 'DESC' },
        });
    }
    async findAllByClass(classId, userId) {
        this.logger.log(`Obteniendo anuncios para la clase ID: ${classId} por usuario ID: ${userId}`);
        // Aquí, classesService.findById ya debería verificar el acceso del usuario
        await this.classesService.findById(classId, userId);
        return this.announcementsRepository.find({
            where: { classId },
            relations: ['author'],
            order: { createdAt: 'DESC' },
        });
    }
    async create(createAnnouncementDto, authorId) {
        this.logger.log(`Usuario con ID ${authorId} intentando crear un anuncio para la clase ID ${createAnnouncementDto.classId}`);
        const author = await this.usersService.findOneById(authorId);
        if (!author.roles?.includes(user_entity_1.UserRole.Profesor) &&
            !author.roles?.includes(user_entity_1.UserRole.Admin)) {
            this.logger.warn(`Usuario ${author.email} (ID: ${authorId}) intentó crear un anuncio sin rol de Profesor o admin.`);
            throw new common_1.ForbiddenException('Solo los profesores o administradores pueden crear anuncios.');
        }
        // Asegúrate de que la clase se carga con las matrículas de estudiantes para enviar correos
        const classEntity = await this.classesService.findById(createAnnouncementDto.classId, authorId, // Pasar authorId para la verificación de acceso en classesService
        ['studentEnrollments', 'studentEnrollments.user'] // <--- AGREGADO: Cargar relaciones necesarias
        );
        if (!author.roles?.includes(user_entity_1.UserRole.Admin) &&
            classEntity.teacherId !== author.id) {
            this.logger.warn(`El profesor ${author.email} (ID: ${authorId}) intentó crear un anuncio en la clase ${classEntity.name} (ID: ${classEntity.id}) pero no es el profesor de dicha clase.`);
            throw new common_1.ForbiddenException('Solo el profesor de la clase o un administrador pueden crear anuncios para esta clase.');
        }
        const announcementData = {
            title: createAnnouncementDto.title,
            content: createAnnouncementDto.content,
            class: classEntity,
            classId: classEntity.id,
            author: author,
            authorId: author.id,
        };
        if (createAnnouncementDto.imageUrl !== undefined) {
            announcementData.imageUrl = createAnnouncementDto.imageUrl;
        }
        const announcement = this.announcementsRepository.create(announcementData);
        try {
            const savedAnnouncement = await this.announcementsRepository.save(announcement);
            this.logger.log(`Anuncio creado con ID ${savedAnnouncement.id} por el usuario ${authorId} para la clase ${classEntity.id}.`);
            // --- Envío de correo electrónico para nuevo anuncio ---
            const studentEmails = classEntity.studentEnrollments
                .map(enrollment => enrollment.user?.email)
                .filter(email => email); // Filtra nulos/undefined
            if (studentEmails.length > 0) {
                const subject = `Nuevo Anuncio en ${classEntity.name}: ${savedAnnouncement.title}`;
                const text = `
          Hola,

          El profesor ${author.firstName} ${author.lastName} ha publicado un nuevo anuncio en la clase "${classEntity.name}":

          Título: ${savedAnnouncement.title}
          Contenido: ${savedAnnouncement.content}

          Por favor, revisa la plataforma SchoolSync para más detalles.

          Saludos,
          El equipo de SchoolSync
        `;
                await this.sendgridService.sendMail({
                    to: studentEmails,
                    subject: subject,
                    text: text,
                    html: `<p>Hola,</p>
                <p>El profesor <strong>${author.firstName} ${author.lastName}</strong> ha publicado un nuevo anuncio en la clase "<strong>${classEntity.name}</strong>":</p>
                <h3>${savedAnnouncement.title}</h3>
                <p>${savedAnnouncement.content}</p>
                <p>Por favor, revisa la plataforma SchoolSync para más detalles.</p>
                <p>Saludos,<br/>El equipo de SchoolSync</p>`,
                });
                this.logger.log(`Notificación de nuevo anuncio enviada a ${studentEmails.length} estudiantes.`);
            }
            else {
                this.logger.log('No hay estudiantes matriculados en la clase para enviar el anuncio.');
            }
            // ----------------------------------------------------
            return savedAnnouncement;
        }
        catch (error) {
            this.logger.error(`Error al guardar el anuncio o enviar correo: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Error al crear el anuncio.');
        }
    }
    async findOneById(id) {
        this.logger.log(`Buscando anuncio con ID: ${id}`);
        const announcement = await this.announcementsRepository.findOne({
            where: { id },
            relations: ['class', 'author'],
        });
        if (!announcement) {
            this.logger.warn(`Anuncio con ID ${id} no encontrado.`);
            throw new common_1.NotFoundException(`Anuncio con ID ${id} no encontrado.`);
        }
        return announcement;
    }
};
exports.AnnouncementsService = AnnouncementsService;
exports.AnnouncementsService = AnnouncementsService = AnnouncementsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(announcement_entity_1.Announcement)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService,
        classes_service_1.ClassesService,
        sendgrid_service_1.SendGridService])
], AnnouncementsService);
//# sourceMappingURL=announcements.service.js.map