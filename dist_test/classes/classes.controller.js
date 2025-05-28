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
var ClassesController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassesController = void 0;
// proyecto/school-sync-backend/src/classes/classes.controller.ts
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const user_entity_1 = require("../users/user.entity");
const classes_service_1 = require("./classes.service");
const create_class_dto_1 = require("./dto/create-class.dto");
const join_class_dto_1 = require("./dto/join-class.dto");
let ClassesController = ClassesController_1 = class ClassesController {
    classesService;
    logger = new common_1.Logger(ClassesController_1.name);
    constructor(classesService) {
        this.classesService = classesService;
    }
    async create(createClassDto, req) {
        const teacherId = req.user.id;
        if (!teacherId) {
            this.logger.warn('Intento de crear clase sin ID de profesor en el token.');
            throw new common_1.ForbiddenException('No se pudo identificar al profesor desde el token.');
        }
        this.logger.log(`Usuario ${teacherId} creando clase: ${createClassDto.name}`);
        return this.classesService.create(createClassDto, teacherId);
    }
    async join(joinClassDto, req) {
        const studentId = req.user.id;
        if (!studentId) {
            this.logger.warn('Intento de unirse a clase sin ID de alumno en el token.');
            throw new common_1.ForbiddenException('No se pudo identificar al alumno desde el token.');
        }
        this.logger.log(`Alumno ${studentId} intentando unirse a clase con código: ${joinClassDto.classCode}`);
        return this.classesService.joinClass(joinClassDto, studentId);
    }
    async findAllForUser(req) {
        const userId = req.user.id;
        if (!userId) {
            this.logger.warn('Intento de obtener clases sin ID de usuario en el token.');
            throw new common_1.ForbiddenException('No se pudo identificar al usuario desde el token.');
        }
        this.logger.log(`Usuario ${userId} solicitando todas sus clases.`);
        return this.classesService.findAllForUser(userId);
    }
    async findOne(classId, req) {
        const userId = req.user.id;
        if (!userId) {
            this.logger.warn(`Intento de obtener clase ${classId} sin ID de usuario en el token.`);
            throw new common_1.ForbiddenException('No se pudo identificar al usuario desde el token.');
        }
        this.logger.log(`Usuario ${userId} solicitando detalles de la clase: ${classId}.`);
        return this.classesService.findById(classId, userId);
    }
    async findClassMembers(classId, req) {
        const userId = req.user.id;
        if (!userId) {
            throw new common_1.ForbiddenException('No se pudo identificar al usuario desde el token.');
        }
        return this.classesService.findClassMembers(classId);
    }
    async importClasses(file, req) {
        const uploaderId = req.user.id;
        if (!uploaderId) {
            this.logger.warn('Intento de importar clases sin ID de cargador en el token.');
            throw new common_1.ForbiddenException('No se pudo identificar al cargador desde el token.');
        }
        if (!file || !file.buffer) {
            this.logger.error('Error en importClasses: Archivo no proporcionado o está vacío después de ParseFilePipe.');
            throw new common_1.BadRequestException('Archivo no proporcionado o está vacío.');
        }
        this.logger.log(`Usuario ${uploaderId} importando clases desde archivo: ${file.originalname}`);
        return this.classesService.importClassesFromExcel(file.buffer, uploaderId);
    }
};
exports.ClassesController = ClassesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.Profesor, user_entity_1.UserRole.Admin),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_class_dto_1.CreateClassDto, Object]),
    __metadata("design:returntype", Promise)
], ClassesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('join'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [join_class_dto_1.JoinClassDto, Object]),
    __metadata("design:returntype", Promise)
], ClassesController.prototype, "join", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClassesController.prototype, "findAllForUser", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ClassesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/members') // Ruta esperada: /api/classes/:id/members
    ,
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ClassesController.prototype, "findClassMembers", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.Profesor, user_entity_1.UserRole.Admin),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)(new common_1.ParseFilePipe({
        validators: [
            new common_1.FileTypeValidator({
                fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            }),
        ],
    }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ClassesController.prototype, "importClasses", null);
exports.ClassesController = ClassesController = ClassesController_1 = __decorate([
    (0, common_1.Controller)('classes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [classes_service_1.ClassesService])
], ClassesController);
//# sourceMappingURL=classes.controller.js.map