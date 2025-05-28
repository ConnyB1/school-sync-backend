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
var UsersController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
// proyecto/school-sync-backend/src/users/users.controller.ts
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const users_service_1 = require("./users.service");
const link_student_dto_1 = require("./dto/link-student.dto");
const update_user_profile_dto_1 = require("./dto/update-user-profile.dto");
let UsersController = UsersController_1 = class UsersController {
    usersService;
    logger = new common_1.Logger(UsersController_1.name);
    constructor(usersService) {
        this.usersService = usersService;
    }
    async findUserByIdentifier(identifier, req) {
        this.logger.log(`Usuario ${req.user.id} buscando usuario por identificador: ${identifier}`);
        if (!identifier) {
            throw new common_1.BadRequestException('El parámetro "identifier" es requerido.');
        }
        try {
            const user = await this.usersService.findByIdentifier(identifier);
            return user;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                this.logger.warn(`Usuario no encontrado con identificador ${identifier}: ${error.message}`);
                throw new common_1.NotFoundException(error.message);
            }
            this.logger.error(`Error buscando usuario por identificador ${identifier}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Error al buscar el usuario.');
        }
    }
    async linkStudentToParent(req, linkStudentDto) {
        const parentId = req.user.id;
        const studentId = linkStudentDto.studentId;
        this.logger.log(`Intentando vincular alumno ID ${studentId} con padre ID ${parentId}`);
        if (!parentId || !studentId) {
            throw new common_1.BadRequestException('IDs de padre y alumno son requeridos.');
        }
        try {
            await this.usersService.linkParentToStudent(parentId, studentId);
            return { message: 'Petición de vinculación de alumno procesada.' };
        }
        catch (error) {
            this.logger.error(`❌ Error en /link-student para padre ${parentId} y alumno ${studentId}: ${error.message}`, error.stack);
            if (error instanceof common_1.NotFoundException ||
                error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Error al procesar la vinculación del alumno.');
        }
    }
    async updateUserProfile(req, updateUserProfileDto, profilePicture) {
        const userId = req.user.id;
        this.logger.log(`Usuario ${userId} (${req.user.email}) actualizando perfil.`);
        const updateData = { ...updateUserProfileDto };
        if (profilePicture) {
            updateData.pictureUrl = `/uploads/profile-pictures/${profilePicture.filename}`;
            this.logger.log(`Nueva foto de perfil para ${userId}: ${updateData.pictureUrl}`);
        }
        try {
            const updatedUser = await this.usersService.updateUserProfile(userId, updateData);
            return updatedUser;
        }
        catch (error) {
            this.logger.error(`❌ Error actualizando perfil para usuario ${userId}: ${error.message}`, error.stack);
            if (error instanceof common_1.NotFoundException ||
                error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Error al actualizar el perfil.');
        }
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('find-by-identifier'),
    __param(0, (0, common_1.Query)('identifier')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findUserByIdentifier", null);
__decorate([
    (0, common_1.Post)('link-student'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, link_student_dto_1.LinkStudentDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "linkStudentToParent", null);
__decorate([
    (0, common_1.Patch)('profile/update'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('profilePicture', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/profile-pictures',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
                return cb(new common_1.BadRequestException('Solo se permiten archivos de imagen (jpg, jpeg, png, gif).'), false);
            }
            cb(null, true);
        },
        limits: { fileSize: 1024 * 1024 * 5 }
    })),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_user_profile_dto_1.UpdateUserProfileDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateUserProfile", null);
exports.UsersController = UsersController = UsersController_1 = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map