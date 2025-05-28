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
var WsJwtAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsJwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users/users.service");
const config_1 = require("@nestjs/config");
// FIXED: Eliminamos la interfaz AuthenticatedUserSocketData
// Usaremos directamente Omit<User, 'password'> para client.data.user
let WsJwtAuthGuard = WsJwtAuthGuard_1 = class WsJwtAuthGuard {
    jwtService;
    usersService;
    configService;
    logger = new common_1.Logger(WsJwtAuthGuard_1.name);
    constructor(jwtService, usersService, configService) {
        this.jwtService = jwtService;
        this.usersService = usersService;
        this.configService = configService;
    }
    async canActivate(context) {
        const client = context.switchToWs().getClient();
        // FIXED: Si client.data.user ya fue establecido por handleConnection, lo consideramos autenticado.
        // Esto evita la re-autenticación y es el punto de falla que reportaste.
        if (client.data.user && client.data.user.id) {
            this.logger.verbose(`WsJwtAuthGuard: Usuario ya autenticado en socket ${client.id} por handleConnection.`);
            return true;
        }
        this.logger.verbose(`WsJwtAuthGuard: client.data.user no encontrado, intentando autenticar para socket ${client.id}...`);
        const token = this.getToken(client);
        if (!token) {
            this.logger.warn(`WsJwtAuthGuard: Token no proporcionado para socket ${client.id}.`);
            this.emitAuthErrorAndDisconnect(client, 'Token not provided.');
            return false;
        }
        try {
            const jwtSecret = this.configService.get('JWT_SECRET');
            if (!jwtSecret) {
                this.logger.error('WsJwtAuthGuard: JWT_SECRET no está configurado.');
                throw new Error('Server configuration error.');
            }
            const payload = await this.jwtService.verifyAsync(token, { secret: jwtSecret });
            // `usersService.findOneById` ya devuelve `Omit<User, 'password'>`
            const user = await this.usersService.findOneById(payload.sub);
            // FIXED: Almacenar el objeto user (Omit<User, 'password'>) directamente
            client.data.user = user;
            this.logger.verbose(`WsJwtAuthGuard: Usuario ${user.email} autenticado exitosamente para socket ${client.id}.`);
            return true;
        }
        catch (error) {
            this.logger.warn(`WsJwtAuthGuard: Error de autenticación para socket ${client.id} - ${error.message}`);
            let errorMessage = 'Invalid token.';
            if (error.name === 'TokenExpiredError') {
                errorMessage = 'Token expired.';
            }
            else if (error.message === 'Server configuration error.') {
                errorMessage = 'Server configuration error during authentication.';
            }
            else if (error.name === 'NotFoundException') {
                errorMessage = 'Invalid user or user not found.';
            }
            this.emitAuthErrorAndDisconnect(client, errorMessage);
            return false;
        }
    }
    getToken(client) {
        const tokenFromAuth = client.handshake.auth?.token;
        if (tokenFromAuth) {
            this.logger.debug(`WsJwtAuthGuard: Token encontrado en handshake.auth.token para ${client.id}`);
            return tokenFromAuth;
        }
        const authHeader = client.handshake.headers?.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            this.logger.debug(`WsJwtAuthGuard: Token encontrado en Authorization header para ${client.id}`);
            return authHeader.split(' ')[1];
        }
        this.logger.debug(`WsJwtAuthGuard: No se encontró token para ${client.id}`);
        return null;
    }
    emitAuthErrorAndDisconnect(client, message) {
        this.logger.warn(`WsJwtAuthGuard: Desconectando cliente ${client.id} debido a: ${message}`);
        client.emit('error', `Authentication failed: ${message}`);
        client.disconnect(true);
    }
};
exports.WsJwtAuthGuard = WsJwtAuthGuard;
exports.WsJwtAuthGuard = WsJwtAuthGuard = WsJwtAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        users_service_1.UsersService,
        config_1.ConfigService])
], WsJwtAuthGuard);
//# sourceMappingURL=ws-jwt-auth.guard.js.map