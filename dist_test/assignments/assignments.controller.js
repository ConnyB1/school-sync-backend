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
var AssignmentsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentsController = void 0;
// proyecto/school-sync-backend/src/assignments/assignments.controller.ts
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const user_entity_1 = require("../users/user.entity");
const assignments_service_1 = require("./assignments.service");
const create_assignment_dto_1 = require("./dto/create-assignment.dto");
const update_assignment_dto_1 = require("./dto/update-assignment.dto");
const path_1 = require("path");
let AssignmentsController = AssignmentsController_1 = class AssignmentsController {
    assignmentsService;
    logger = new common_1.Logger(AssignmentsController_1.name);
    constructor(assignmentsService) {
        this.assignmentsService = assignmentsService;
    }
    async create(createAssignmentDto, req, file) {
        const teacherId = req.user.id;
        if (!teacherId) {
            this.logger.warn('Intento de crear tarea sin ID de profesor en el token.');
            throw new common_1.ForbiddenException('No se pudo identificar al profesor desde el token.');
        }
        this.logger.log(`Usuario ${teacherId} creando tarea: ${createAssignmentDto.title}`);
        // Asegurarse de que createAssignmentDto.assignmentFileUrl se establece si se envía en el DTO (no por el archivo)
        // El archivo se maneja directamente por el servicio
        return this.assignmentsService.createAssignment(createAssignmentDto, teacherId, file);
    }
    async findAll(req) {
        const userId = req.user.id;
        if (!userId) {
            this.logger.warn('Intento de obtener tareas sin ID de usuario en el token.');
            throw new common_1.ForbiddenException('No se pudo identificar al usuario desde el token.');
        }
        this.logger.log(`Usuario ${userId} solicitando todas sus tareas.`);
        return this.assignmentsService.findAllAssignments(userId);
    }
    async findAllByClassId(classId, req) {
        const userId = req.user.id;
        if (!userId) {
            this.logger.warn(`Intento de obtener tareas para clase ${classId} sin ID de usuario en el token.`);
            throw new common_1.ForbiddenException('No se pudo identificar al usuario desde el token.');
        }
        this.logger.log(`Usuario ${userId} solicitando tareas para la clase: ${classId}.`);
        return this.assignmentsService.findAllByClassId(classId, userId);
    }
    async findOne(assignmentId, req) {
        const userId = req.user.id;
        if (!userId) {
            this.logger.warn(`Intento de obtener tarea ${assignmentId} sin ID de usuario en el token.`);
            throw new common_1.ForbiddenException('No se pudo identificar al usuario desde el token.');
        }
        this.logger.log(`Usuario ${userId} solicitando detalles de la tarea: ${assignmentId}.`);
        return this.assignmentsService.findOneAssignment(assignmentId, userId);
    }
    async update(id, updateAssignmentDto, req, file) {
        const teacherId = req.user.id;
        if (!teacherId) {
            throw new common_1.ForbiddenException('No se pudo identificar al profesor desde el token.');
        }
        this.logger.log(`Profesor ${teacherId} actualizando tarea: ${id}`);
        return this.assignmentsService.updateAssignment(id, updateAssignmentDto, teacherId, file); // Pasa el archivo
    }
    async remove(id, req) {
        const teacherId = req.user.id;
        if (!teacherId) {
            throw new common_1.ForbiddenException('No se pudo identificar al profesor desde el token.');
        }
        this.logger.log(`Profesor ${teacherId} eliminando tarea: ${id}`);
        await this.assignmentsService.removeAssignment(id, teacherId);
    }
    async submitAssignment(assignmentId, file, req) {
        const studentId = req.user.id;
        if (!studentId) {
            this.logger.warn('Intento de subir tarea sin ID de alumno en el token.');
            throw new common_1.ForbiddenException('No se pudo identificar al alumno desde el token.');
        }
        this.logger.log(`Received file object for submission: ${JSON.stringify(file ? { originalname: file.originalname, mimetype: file.mimetype, size: file.size } : 'No file', null, 2)}`);
        if (!file) {
            this.logger.error('Error en submitAssignment: Archivo no proporcionado después de la validación.');
            throw new common_1.BadRequestException('Archivo de entrega no proporcionado o inválido.');
        }
        this.logger.log(`Alumno ${studentId} subiendo archivo para tarea ${assignmentId}: ${file.originalname}`);
        return this.assignmentsService.submitAssignment(assignmentId, studentId, file);
    }
    async getSubmissionsForAssignment(assignmentId, req) {
        const userId = req.user.id;
        if (!userId) {
            throw new common_1.ForbiddenException('No se pudo identificar al usuario desde el token.');
        }
        this.logger.log(`Profesor/Admin ${userId} solicitando entregas para tarea ${assignmentId}.`);
        return this.assignmentsService.getSubmissionsForAssignment(assignmentId);
    }
    async getMySubmissionForAssignment(assignmentId, req) {
        const studentId = req.user.id;
        if (!studentId) {
            throw new common_1.ForbiddenException('No se pudo identificar al alumno desde el token.');
        }
        this.logger.log(`Alumno ${studentId} solicitando su entrega para tarea ${assignmentId}.`);
        return this.assignmentsService.getMySubmissionForAssignment(assignmentId, studentId);
    }
    async gradeSubmission(submissionId, grade, feedback, req) {
        const teacherId = req.user.id;
        if (!teacherId) {
            throw new common_1.ForbiddenException('No se pudo identificar al profesor desde el token.');
        }
        if (typeof grade !== 'number' || grade < 1 || grade > 100) {
            throw new common_1.BadRequestException('La calificación debe ser un número entre 1 y 100.');
        }
        this.logger.log(`Profesor ${teacherId} calificando entrega ${submissionId} con ${grade}.`);
        return this.assignmentsService.gradeSubmission(submissionId, grade, feedback, teacherId);
    }
    seeUploadedFile(folder, filename, res) {
        if (!['assignments', 'submissions'].includes(folder)) {
            throw new common_1.BadRequestException('Carpeta de archivos no válida.');
        }
        const filePath = (0, path_1.join)(process.cwd(), 'uploads', folder, filename);
        this.logger.log(`Sirviendo archivo desde: ${filePath}`);
        try {
            return res.sendFile(filePath);
        }
        catch (error) {
            this.logger.error(`Error al servir el archivo ${filePath}: ${error.message}`);
            throw new common_1.NotFoundException('Archivo no encontrado.');
        }
    }
};
exports.AssignmentsController = AssignmentsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.Profesor, user_entity_1.UserRole.Admin),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')) // El nombre del campo del archivo debe ser 'file'
    ,
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_assignment_dto_1.CreateAssignmentDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('class/:classId'),
    __param(0, (0, common_1.Param)('classId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "findAllByClassId", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.Profesor, user_entity_1.UserRole.Admin),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')) // El nombre del campo del archivo debe ser 'file'
    ,
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __param(3, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_assignment_dto_1.UpdateAssignmentDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.Profesor, user_entity_1.UserRole.Admin),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')) // El nombre del campo del archivo debe ser 'file'
    ,
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.UploadedFile)(new common_1.ParseFilePipe({
        validators: [
            new common_1.FileTypeValidator({ fileType: /(application\/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document|vnd.ms-excel|vnd.openxmlformats-officedocument.spreadsheetml.document)|image\/(jpeg|png|gif)|text\/plain)/ }),
            new common_1.MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }), // 10MB
        ],
    }))),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "submitAssignment", null);
__decorate([
    (0, common_1.Get)(':id/submissions'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.Profesor, user_entity_1.UserRole.Admin),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "getSubmissionsForAssignment", null);
__decorate([
    (0, common_1.Get)('my-submissions/assignment/:assignmentId'),
    __param(0, (0, common_1.Param)('assignmentId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "getMySubmissionForAssignment", null);
__decorate([
    (0, common_1.Patch)('submissions/:submissionId/grade'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.Profesor, user_entity_1.UserRole.Admin),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Param)('submissionId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)('grade')),
    __param(2, (0, common_1.Body)('feedback')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String, Object]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "gradeSubmission", null);
__decorate([
    (0, common_1.Get)('uploads/:folder/:filename'),
    __param(0, (0, common_1.Param)('folder')),
    __param(1, (0, common_1.Param)('filename')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], AssignmentsController.prototype, "seeUploadedFile", null);
exports.AssignmentsController = AssignmentsController = AssignmentsController_1 = __decorate([
    (0, common_1.Controller)('assignments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [assignments_service_1.AssignmentsService])
], AssignmentsController);
//# sourceMappingURL=assignments.controller.js.map