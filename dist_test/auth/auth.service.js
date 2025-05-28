"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
// proyecto/school-sync-backend/src/auth/auth.service.ts
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users/users.service");
const bcrypt = __importStar(require("bcryptjs"));
let AuthService = AuthService_1 = class AuthService {
    usersService;
    jwtService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async register(registerUserDto) {
        const { email, password, firstName, lastName, roles } = registerUserDto;
        try {
            await this.usersService.findOneByEmail(email);
            throw new common_1.ConflictException('El correo electrónico ya está en uso.');
        }
        catch (error) {
            if (!(error instanceof common_1.NotFoundException)) {
                throw error;
            }
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        try {
            const userWithoutPassword = await this.usersService.createUserInternal({
                email,
                password: hashedPassword,
                firstName,
                lastName,
                roles,
            });
            return userWithoutPassword;
        }
        catch (error) {
            this.logger.error(`Error al registrar usuario: ${error.message}`, error.stack);
            if (error instanceof common_1.ConflictException || error instanceof common_1.InternalServerErrorException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Error al registrar el usuario.');
        }
    }
    async login(loginUserDto) {
        const { email, password } = loginUserDto;
        this.logger.log(`Intento de login para: ${email}`);
        const userWithPassword = await this.usersService.findOneByEmailWithPassword(email);
        if (!userWithPassword) {
            this.logger.warn(`Login fallido para ${email}: Usuario no encontrado.`);
            throw new common_1.UnauthorizedException('Credenciales inválidas.');
        }
        const isPasswordMatching = await bcrypt.compare(password, userWithPassword.password);
        if (!isPasswordMatching) {
            this.logger.warn(`Login fallido para ${email}: Contraseña incorrecta.`);
            throw new common_1.UnauthorizedException('Credenciales inválidas.');
        }
        const { password: _omittedPassword, ...userResult } = userWithPassword;
        const payload = {
            sub: userResult.id,
            email: userResult.email,
            roles: userResult.roles,
        };
        const accessToken = this.jwtService.sign(payload);
        return { accessToken, user: userResult };
    }
    async validateUserById(userId) {
        this.logger.debug(`AuthService: Validando usuario por ID ${userId}`);
        try {
            const user = await this.usersService.findOneById(userId);
            return user;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                this.logger.warn(`AuthService: Usuario no encontrado con ID ${userId} durante validateUserById.`);
                return null;
            }
            this.logger.error(`AuthService: Error validando usuario por ID ${userId}: ${error.message}`);
            throw new common_1.InternalServerErrorException('Error validando usuario.');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map