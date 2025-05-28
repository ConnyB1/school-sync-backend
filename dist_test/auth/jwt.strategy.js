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
var JwtStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
// proyecto/school-sync-backend/src/auth/jwt.strategy.ts
const common_1 = require("@nestjs/common"); // Añadido NotFoundException
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const users_service_1 = require("../users/users.service");
let JwtStrategy = JwtStrategy_1 = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    configService;
    usersService;
    logger = new common_1.Logger(JwtStrategy_1.name);
    constructor(configService, usersService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET'),
        });
        this.configService = configService;
        this.usersService = usersService;
        this.logger.log('JwtStrategy (local) inicializada.');
        if (!configService.get('JWT_SECRET')) {
            this.logger.error('FATAL ERROR: JWT_SECRET no está definido en la configuración.');
            // Considera lanzar un error aquí para detener el inicio de la aplicación si el secreto no está.
        }
    }
    async validate(payload) {
        this.logger.debug(`Validando payload JWT: Usuario ID ${payload.sub}, Email ${payload.email}`);
        if (!payload || !payload.sub) {
            this.logger.warn('Intento de validación con payload JWT inválido o ausente de "sub".');
            throw new common_1.UnauthorizedException('Token inválido: payload incorrecto.');
        }
        try {
            // usersService.findOneById devuelve Omit<User, 'password'> o lanza NotFoundException
            const user = await this.usersService.findOneById(payload.sub);
            // user aquí es Omit<User, 'password'>
            // La línea 58 original donde ocurría el error TS2339 no debería intentar acceder a 'password'
            // ya que 'user' no lo tiene. Si había una desestructuración como:
            // const { password, ...result } = user; // Esto causaría el error en esta línea.
            // Ya no es necesaria porque 'user' ya es seguro.
            this.logger.log(`Usuario ${user.email} (ID: ${user.id}) autenticado exitosamente vía JWT.`);
            return user; // Devolver 'user' directamente, ya es Omit<User, 'password'>
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) { // Si findOneById lanza NotFoundException
                this.logger.warn(`Usuario no encontrado con ID (sub): ${payload.sub} durante la validación del JWT.`);
                throw new common_1.UnauthorizedException('Token inválido o usuario no encontrado.');
            }
            // Para otros posibles errores de usersService.findOneById o errores inesperados
            this.logger.error(`Error inesperado durante la validación del JWT para sub ${payload.sub}: ${error.message || error}`);
            throw new common_1.UnauthorizedException('Error de autenticación.');
        }
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = JwtStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        users_service_1.UsersService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map