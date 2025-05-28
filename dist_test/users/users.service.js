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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
// proyecto/school-sync-backend/src/users/users.service.ts
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
let UsersService = UsersService_1 = class UsersService {
    usersRepository;
    logger = new common_1.Logger(UsersService_1.name);
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async findOneById(id) {
        this.logger.debug(`Buscando usuario por ID local: ${id}`);
        if (!id) {
            this.logger.warn('findOneById llamado con ID nulo o indefinido.');
            throw new common_1.BadRequestException('ID de usuario no proporcionado.');
        }
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            this.logger.debug(`Usuario no encontrado con ID local: ${id}`);
            throw new common_1.NotFoundException(`Usuario con ID "${id}" no encontrado.`);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async findOneByEmail(email) {
        this.logger.debug(`Buscando usuario por email: ${email}`);
        if (!email) {
            this.logger.warn('findOneByEmail llamado con email nulo o indefinido.');
            throw new common_1.BadRequestException('Email no proporcionado.');
        }
        const user = await this.usersRepository.findOne({ where: { email } });
        if (!user) {
            this.logger.debug(`Usuario no encontrado con email: ${email}`);
            throw new common_1.NotFoundException(`Usuario con email "${email}" no encontrado.`);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async findByIdentifier(identifier) {
        this.logger.debug(`Buscando usuario por identificador (email): ${identifier}`);
        if (!identifier) {
            throw new common_1.BadRequestException('Identificador no proporcionado.');
        }
        const user = await this.usersRepository.findOne({ where: { email: identifier } });
        if (!user) {
            this.logger.warn(`Usuario no encontrado con identificador "${identifier}"`);
            throw new common_1.NotFoundException(`Usuario con identificador "${identifier}" no encontrado.`);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async findOneByEmailWithPassword(email) {
        this.logger.debug(`Buscando usuario por email (con contraseña) para login: ${email}`);
        if (!email) {
            this.logger.warn('findOneByEmailWithPassword llamado con email nulo o indefinido.');
            return undefined;
        }
        const user = await this.usersRepository
            .createQueryBuilder('user')
            .where('user.email = :email', { email })
            .addSelect('user.password')
            .getOne();
        if (!user) {
            this.logger.debug(`Usuario no encontrado para login con email: ${email}`);
            return undefined;
        }
        return user;
    }
    async createUserInternal(userData) {
        const { email, password, firstName, lastName, pictureUrl, roles } = userData;
        this.logger.log(`Intentando crear internamente usuario con email: ${email}`);
        if (!email || !password) {
            throw new common_1.BadRequestException('Email y contraseña son requeridos para crear un usuario.');
        }
        const existingUserCheck = await this.usersRepository.findOne({ where: { email } });
        if (existingUserCheck) {
            this.logger.warn(`Conflicto: El correo electrónico "${email}" ya está registrado.`);
            throw new common_1.ConflictException(`El correo electrónico "${email}" ya está registrado.`);
        }
        const newUserEntity = this.usersRepository.create({
            email,
            password,
            firstName,
            lastName,
            pictureUrl,
            roles: roles && roles.length > 0 ? roles : [user_entity_1.UserRole.Alumno],
        });
        try {
            const savedUser = await this.usersRepository.save(newUserEntity);
            this.logger.log(`Usuario creado internamente con ID: ${savedUser.id}`);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _omittedPassword, ...result } = savedUser;
            return result;
        }
        catch (error) {
            this.logger.error(`Error al guardar nuevo usuario: ${error.message}`, error.stack);
            if (error.code === '23505') {
                throw new common_1.ConflictException(`Error de unicidad: ${error.detail || 'El correo electrónico ya existe.'}`);
            }
            throw new common_1.InternalServerErrorException('Error interno al crear el usuario.');
        }
    }
    async createUser(createUserDto) {
        this.logger.log(`createUser llamado con DTO: ${JSON.stringify(createUserDto)}`);
        if (createUserDto.password && !createUserDto.password.startsWith('$2a$') && !createUserDto.password.startsWith('$2b$')) {
            throw new common_1.BadRequestException('UsersService.createUser no debe manejar contraseñas sin hashear. Use AuthService.register para el registro de usuarios.');
        }
        return this.createUserInternal(createUserDto);
    }
    async linkParentToStudent(parentId, studentId) {
        this.logger.warn(`Intento de vinculación Padre ID: ${parentId}, Alumno ID: ${studentId}`);
        const parent = await this.findOneById(parentId);
        const student = await this.findOneById(studentId);
        if (!parent.roles?.includes(user_entity_1.UserRole.Padre) || !student.roles?.includes(user_entity_1.UserRole.Alumno)) {
            throw new common_1.BadRequestException('Roles inválidos para la vinculación.');
        }
        this.logger.log(`Vinculación entre ${parent.email} y ${student.email} procesada (lógica pendiente).`);
    }
    async updateUserProfile(userId, updateData) {
        this.logger.log(`Actualizando perfil para usuario ID: ${userId} con datos ${JSON.stringify(updateData)}`);
        const userToUpdate = await this.usersRepository.findOne({ where: { id: userId } });
        if (!userToUpdate) {
            throw new common_1.NotFoundException(`Usuario con ID ${userId} no encontrado para actualizar.`);
        }
        if (updateData.firstName !== undefined)
            userToUpdate.firstName = updateData.firstName;
        if (updateData.lastName !== undefined)
            userToUpdate.lastName = updateData.lastName;
        if (updateData.pictureUrl !== undefined)
            userToUpdate.pictureUrl = updateData.pictureUrl;
        try {
            const updatedUser = await this.usersRepository.save(userToUpdate);
            this.logger.log(`Perfil actualizado para usuario ID: ${updatedUser.id}`);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _omittedPassword, ...result } = updatedUser;
            return result;
        }
        catch (error) {
            this.logger.error(`Error al actualizar perfil del usuario ${userId}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Error al actualizar el perfil.');
        }
    }
    async getLinkedStudentsForParent(parentId) {
        this.logger.warn(`FUNCIONALIDAD NO IMPLEMENTADA: getLinkedStudentsForParent (Padre ID: ${parentId})`);
        const parent = await this.findOneById(parentId);
        if (!parent.roles?.includes(user_entity_1.UserRole.Padre)) {
            throw new common_1.NotFoundException('Padre no encontrado o rol incorrecto.');
        }
        return [];
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map