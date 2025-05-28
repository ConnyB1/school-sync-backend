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
var AnnouncementsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnouncementsController = void 0;
// proyecto/school-sync-backend/src/announcements/announcements.controller.ts
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const user_entity_1 = require("../users/user.entity");
const announcements_service_1 = require("./announcements.service");
const create_announcement_dto_1 = require("./dto/create-announcement.dto");
let AnnouncementsController = AnnouncementsController_1 = class AnnouncementsController {
    announcementsService;
    logger = new common_1.Logger(AnnouncementsController_1.name);
    constructor(announcementsService) {
        this.announcementsService = announcementsService;
    }
    async findAllByClass(classId, req) {
        const userId = req.user.id;
        if (!userId) {
            this.logger.warn(`Intento de obtener anuncios de clase ${classId} sin ID de usuario en el token.`);
            throw new common_1.ForbiddenException('No se pudo identificar al usuario desde el token.');
        }
        this.logger.log(`Usuario ${userId} solicitando anuncios para la clase: ${classId}`);
        return this.announcementsService.findAllByClass(classId, userId);
    }
    async create(createAnnouncementDto, req) {
        const authorId = req.user.id;
        if (!authorId) {
            this.logger.warn('Intento de crear anuncio sin ID de autor en el token.');
            throw new common_1.ForbiddenException('No se pudo identificar al autor desde el token.');
        }
        this.logger.log(`Usuario ${authorId} creando anuncio: ${createAnnouncementDto.title}`);
        return this.announcementsService.create(createAnnouncementDto, authorId);
    }
    // No hay necesidad de un @Roles(UserRole.Admin) aquí, ya que findAll() es una ruta general
    async findAll(req) {
        this.logger.log(`Usuario ${req.user.id} solicitando todos los anuncios.`);
        return this.announcementsService.findAll();
    }
};
exports.AnnouncementsController = AnnouncementsController;
__decorate([
    (0, common_1.Get)('class/:classId') // Esta ruta debe estar presente y correcta
    ,
    __param(0, (0, common_1.Param)('classId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AnnouncementsController.prototype, "findAllByClass", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.Profesor, user_entity_1.UserRole.Admin),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_announcement_dto_1.CreateAnnouncementDto, Object]),
    __metadata("design:returntype", Promise)
], AnnouncementsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)()
    // No hay necesidad de un @Roles(UserRole.Admin) aquí, ya que findAll() es una ruta general
    ,
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnnouncementsController.prototype, "findAll", null);
exports.AnnouncementsController = AnnouncementsController = AnnouncementsController_1 = __decorate([
    (0, common_1.Controller)('announcements'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [announcements_service_1.AnnouncementsService])
], AnnouncementsController);
//# sourceMappingURL=announcements.controller.js.map