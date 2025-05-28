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
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
// proyecto/school-sync-backend/src/chat/chat.gateway.ts
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const chat_service_1 = require("./chat.service");
const common_1 = require("@nestjs/common");
const create_message_dto_1 = require("./dto/create-message.dto");
const ws_jwt_auth_guard_1 = require("../auth/ws-jwt-auth.guard");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const users_service_1 = require("../users/users.service");
const message_entity_1 = require("./entities/message.entity");
// FIXED: Eliminamos la interfaz AuthenticatedUserSocketData
// Usaremos directamente Omit<User, 'password'> para client.data.user
let ChatGateway = ChatGateway_1 = class ChatGateway {
    chatService;
    jwtService;
    configService;
    usersService;
    server;
    logger = new common_1.Logger(ChatGateway_1.name);
    constructor(chatService, jwtService, configService, usersService) {
        this.chatService = chatService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.usersService = usersService;
    }
    afterInit(server) {
        this.logger.log('ChatGateway inicializado y listo!');
    }
    async handleConnection(client, ...args) {
        this.logger.log(`Nuevo cliente intentando conectar: ${client.id}`);
        const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
        if (!token) {
            this.logger.warn(`Cliente ${client.id}: Token no proporcionado. Desconectando.`);
            client.emit('error', 'Authentication failed: Token not provided.');
            client.disconnect(true);
            return;
        }
        try {
            const jwtSecret = this.configService.get('JWT_SECRET');
            if (!jwtSecret) {
                this.logger.error('JWT_SECRET no está configurado en el servidor.');
                throw new Error('Error de configuración del servidor.');
            }
            const payload = await this.jwtService.verifyAsync(token, { secret: jwtSecret });
            // FIXED: Almacena directamente el objeto User (Omit<User, 'password'>)
            // `usersService.findOneById` ya devuelve `Omit<User, 'password'>`
            const user = await this.usersService.findOneById(payload.sub);
            // Asigna el usuario a client.data.user. Socket.IO permite extender el objeto client.data.
            client.data.user = user;
            this.logger.log(`Cliente ${client.id} (Usuario: ${user.email}) autenticado y conectado exitosamente.`);
            client.emit('authenticated');
        }
        catch (error) {
            this.logger.warn(`Cliente ${client.id}: Autenticación fallida en handleConnection - ${error.message}. Desconectando.`);
            let errorMessage = 'Authentication failed: Invalid token.';
            if (error.name === 'TokenExpiredError') {
                errorMessage = 'Authentication failed: Token expired.';
            }
            else if (error.message === 'Error de configuración del servidor.') {
                errorMessage = 'Server configuration error during authentication.';
            }
            else if (error.name === 'NotFoundException') {
                errorMessage = 'Authentication failed: User not found.';
            }
            client.emit('error', errorMessage);
            client.disconnect(true);
        }
    }
    handleDisconnect(client) {
        // FIXED: Accede al usuario de client.data como Omit<User, 'password'>
        const user = client.data.user;
        if (user) {
            this.logger.log(`Cliente ${client.id} (Usuario: ${user.email}) desconectado.`);
        }
        else {
            this.logger.log(`Cliente ${client.id} desconectado (no autenticado previamente).`);
        }
    }
    async handleJoinRoom(client, roomId) {
        // FIXED: Accede al usuario de client.data como Omit<User, 'password'>
        const user = client.data.user;
        this.logger.log(`Usuario ${user.email} (Socket: ${client.id}) solicitando unirse a la sala: ${roomId}`);
        try {
            client.join(roomId);
            this.logger.log(`Usuario ${user.email} se unió exitosamente a la sala: ${roomId}`);
            this.server.to(client.id).emit('joinedRoom', roomId);
        }
        catch (error) {
            this.logger.error(`Error al unir usuario ${user.email} a sala ${roomId}: ${error.message}`);
            this.server.to(client.id).emit('error', `No se pudo unir a la sala ${roomId}: ${error.message || 'Permiso denegado'}`);
        }
    }
    async handleMessage(client, payload) {
        // FIXED: Accede al usuario de client.data como Omit<User, 'password'>
        const userSocketData = client.data.user;
        this.logger.debug(`RAW PAYLOAD RECIBIDO en handleMessage: ${JSON.stringify(payload)}`);
        try {
            const messageToSave = {
                content: payload.content,
                roomId: payload.roomId,
                roomType: payload.roomType,
                classId: payload.roomType === message_entity_1.RoomType.CLASS ? payload.classId : undefined,
            };
            // FIXED: Pasa userSocketData que ahora es de tipo Omit<User, 'password'>
            const savedMessage = await this.chatService.createMessage(messageToSave, userSocketData);
            this.logger.log(`Mensaje de ${userSocketData.email} para sala ${payload.roomId} guardado.`);
            const messageToEmit = {
                id: savedMessage.id,
                content: savedMessage.content,
                timestamp: savedMessage.timestamp,
                roomId: savedMessage.roomId,
                roomType: savedMessage.roomType,
                classId: savedMessage.classId,
                recipientId: savedMessage.recipientId,
                sender: {
                    id: userSocketData.id,
                    firstName: userSocketData.firstName,
                    lastName: userSocketData.lastName,
                    email: userSocketData.email,
                },
            };
            this.server.to(payload.roomId).emit('newMessage', messageToEmit);
            this.logger.log(`Mensaje de ${userSocketData.email} emitido a la sala ${payload.roomId}`);
        }
        catch (error) {
            this.logger.error(`Error procesando mensaje de ${userSocketData.email} para ${payload.roomId}: ${error.message}`, error.stack);
            this.server.to(client.id).emit('error', `Error al enviar mensaje: ${error.message}`);
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_auth_guard_1.WsJwtAuthGuard),
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_auth_guard_1.WsJwtAuthGuard),
    (0, websockets_1.SubscribeMessage)('message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, create_message_dto_1.CreateMessageDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessage", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:8080'],
            methods: ['GET', 'POST'],
            credentials: true,
        },
    }),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        jwt_1.JwtService,
        config_1.ConfigService,
        users_service_1.UsersService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map