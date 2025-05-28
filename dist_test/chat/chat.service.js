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
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
// proyecto/school-sync-backend/src/chat/chat.service.ts
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm"); // Brackets no se usa aquí directamente
const message_entity_1 = require("./entities/message.entity");
const user_entity_1 = require("../users/user.entity");
const class_entity_1 = require("../classes/class.entity");
const class_enrollment_entity_1 = require("../class-enrollments/class-enrollment.entity");
let ChatService = ChatService_1 = class ChatService {
    messageRepository;
    userRepository;
    classRepository;
    classEnrollmentRepository;
    logger = new common_1.Logger(ChatService_1.name);
    constructor(messageRepository, userRepository, classRepository, classEnrollmentRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.classRepository = classRepository;
        this.classEnrollmentRepository = classEnrollmentRepository;
    }
    async createMessage(createMessageDto, sender) {
        this.logger.log(`Creando mensaje en sala ${createMessageDto.roomId} de usuario ${sender.email}`);
        // Validaciones (usando 'sender' en lugar de 'user')
        if (createMessageDto.roomType === message_entity_1.RoomType.CLASS) {
            if (!createMessageDto.classId) {
                this.logger.warn(`Intento de crear mensaje de clase sin classId para room ${createMessageDto.roomId}`);
                throw new common_1.ForbiddenException('Se requiere classId para mensajes de tipo CLASS.');
            }
            const classExists = await this.classRepository.findOneBy({ id: createMessageDto.classId });
            if (!classExists) {
                throw new common_1.NotFoundException(`Clase con ID ${createMessageDto.classId} no encontrada.`);
            }
            const isEnrolledAsStudent = await this.classEnrollmentRepository.findOneBy({
                classId: createMessageDto.classId, // Corregido para buscar por classId directamente
                userId: sender.id
            });
            if (!isEnrolledAsStudent && classExists.teacherId !== sender.id) {
                this.logger.warn(`Usuario ${sender.email} intentando enviar mensaje a clase ${createMessageDto.classId} sin ser miembro o profesor.`);
                throw new common_1.ForbiddenException('No tienes permiso para enviar mensajes a esta clase.');
            }
            // Opcional: Validar o corregir roomId para mensajes de clase
            if (createMessageDto.roomId !== `class-${createMessageDto.classId}`) {
                this.logger.warn(`El roomId '${createMessageDto.roomId}' no coincide con el formato esperado 'class-${createMessageDto.classId}'. Considerar corrección o validación estricta.`);
                // createMessageDto.roomId = `class-${createMessageDto.classId}`; // Podrías corregirlo si es necesario
            }
        }
        else if (createMessageDto.roomType === message_entity_1.RoomType.DIRECT) {
            const participants = createMessageDto.roomId.replace(/^dm-/, '').split('-'); // Asegura quitar 'dm-' solo al inicio
            if (participants.length !== 2 || !participants.includes(sender.id)) {
                this.logger.warn(`Usuario ${sender.email} intentando enviar a DM ${createMessageDto.roomId} con formato inválido o sin ser participante listado en el ID.`);
                throw new common_1.ForbiddenException('Formato de sala directa inválido o no eres participante.');
            }
            const otherParticipantId = participants.find(id => id !== sender.id);
            if (otherParticipantId) {
                const otherUserExists = await this.userRepository.findOneBy({ id: otherParticipantId });
                if (!otherUserExists) {
                    throw new common_1.NotFoundException(`El otro usuario en el chat directo (ID: ${otherParticipantId}) no fue encontrado.`);
                }
                // Asignar recipientId si la entidad Message tiene este campo y es un DM
                if ('recipientId' in createMessageDto && !createMessageDto.recipientId) {
                    createMessageDto.recipientId = otherParticipantId;
                }
            }
            else {
                this.logger.error(`No se pudo identificar al otro participante en el DM room: ${createMessageDto.roomId} para sender: ${sender.id}`);
                throw new common_1.InternalServerErrorException('Error al procesar el chat directo.');
            }
        }
        // ÚNICA declaración y creación de newMessageEntity
        const newMessageData = {
            content: createMessageDto.content,
            roomId: createMessageDto.roomId,
            roomType: createMessageDto.roomType,
            classId: createMessageDto.roomType === message_entity_1.RoomType.CLASS ? createMessageDto.classId : undefined,
            senderId: sender.id,
            sender: sender, // Cast Omit<User, 'password'> a User para la relación
            timestamp: new Date(),
        };
        // Si es un mensaje directo y tienes recipientId en tu entidad Message y quieres asignarlo:
        if (createMessageDto.roomType === message_entity_1.RoomType.DIRECT) {
            const participants = createMessageDto.roomId.replace(/^dm-/, '').split('-');
            const otherParticipantId = participants.find(id => id !== sender.id);
            if (otherParticipantId) {
                newMessageData.recipientId = otherParticipantId;
            }
        }
        const newMessageEntity = this.messageRepository.create(newMessageData);
        try {
            const savedMessage = await this.messageRepository.save(newMessageEntity);
            this.logger.log(`Mensaje guardado con ID: ${savedMessage.id} en sala ${savedMessage.roomId}`);
            return savedMessage;
        }
        catch (error) {
            this.logger.error(`Error al guardar mensaje de ${sender.email} en sala ${createMessageDto.roomId}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Error interno al guardar el mensaje.');
        }
    }
    async getMessagesForRoom(roomId, userId, // ID del usuario que solicita, para validación de acceso
    page = 1, limit = 50) {
        this.logger.log(`Usuario ${userId} obteniendo mensajes para la sala: ${roomId}, página ${page}, límite ${limit}`);
        if (roomId.startsWith('dm-')) {
            const participants = roomId.replace(/^dm-/, '').split('-');
            if (!participants.includes(userId)) {
                this.logger.warn(`Usuario ${userId} intentó acceder a sala DM ${roomId} sin ser participante.`);
                throw new common_1.ForbiddenException('No tienes acceso a esta sala de chat directo.');
            }
        }
        else if (roomId.startsWith('class-')) {
            const classId = roomId.replace(/^class-/, '');
            const classExists = await this.classRepository.findOneBy({ id: classId });
            if (!classExists)
                throw new common_1.NotFoundException(`Clase para sala ${roomId} no encontrada.`);
            const isEnrolled = await this.classEnrollmentRepository.findOneBy({ classId, userId });
            if (!isEnrolled && classExists.teacherId !== userId) {
                this.logger.warn(`Usuario ${userId} intentó acceder a sala de clase ${roomId} sin ser miembro o profesor.`);
                throw new common_1.ForbiddenException('No tienes acceso a esta sala de clase.');
            }
        }
        else {
            this.logger.warn(`Formato de roomId desconocido: ${roomId} para usuario ${userId}`);
            throw new common_1.ForbiddenException('Formato de sala desconocido.');
        }
        const findOptions = {
            where: { roomId },
            order: { timestamp: 'DESC' },
            relations: ['sender'], // Asegura que el sender se cargue con sus campos (sin contraseña si Message.sender usa User y User.password es select:false)
            take: limit,
            skip: (page - 1) * limit,
        };
        const messages = await this.messageRepository.find(findOptions);
        return messages.reverse();
    }
    async getUserChatRooms(user) {
        this.logger.log(`Obteniendo salas de chat para usuario ${user.email}`);
        const enrollments = await this.classEnrollmentRepository.find({
            where: { userId: user.id },
            relations: ['class'], // Carga la entidad Class relacionada
        });
        const classRooms = enrollments
            .filter(enrollment => enrollment.class) // Filtrar por si alguna clase fuera null
            .map(enrollment => ({
            id: `class-${enrollment.classId}`,
            name: enrollment.class.name, // Acceder a class.name
            type: message_entity_1.RoomType.CLASS,
            originalId: enrollment.classId,
        }));
        // Para mensajes directos, la consulta original con LIKE puede ser ineficiente.
        // Es mejor si guardas recipientId en la entidad Message.
        // Si Message tiene senderId y recipientId para DMs:
        const directMessagesFromUser = await this.messageRepository.find({
            where: [
                { senderId: user.id, roomType: message_entity_1.RoomType.DIRECT },
                { recipientId: user.id, roomType: message_entity_1.RoomType.DIRECT }
            ],
            select: ['roomId', 'senderId', 'recipientId'], // Seleccionar solo lo necesario
            order: { timestamp: 'DESC' } // Para obtener el último mensaje si es necesario después
        });
        const directRoomIds = new Set();
        directMessagesFromUser.forEach(msg => msg.roomId && directRoomIds.add(msg.roomId));
        const directRooms = await Promise.all(Array.from(directRoomIds).map(async (roomId) => {
            const participants = roomId.replace(/^dm-/, '').split('-');
            const otherUserId = participants.find(id => id !== user.id);
            let otherUserName = 'Usuario Desconocido';
            if (otherUserId) {
                const otherUser = await this.userRepository.findOne({
                    where: { id: otherUserId },
                    select: ['firstName', 'lastName', 'email'] // Seleccionar solo lo necesario, sin contraseña
                });
                if (otherUser) {
                    otherUserName = `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email;
                }
            }
            return {
                id: roomId,
                name: otherUserName,
                type: message_entity_1.RoomType.DIRECT,
                targetUserId: otherUserId || 'unknown',
            };
        }));
        return [...classRooms, ...directRooms];
    }
    // El método getRoomMessages original parece bien, pero el parámetro 'user' es tipo 'User'
    // Si lo llamas desde un sitio donde tienes Omit<User, 'password'>, necesitarás castear o ajustar.
    // Por ahora lo dejo como está, asumiendo que el contexto de llamada maneja el tipo 'User'.
    async getRoomMessages(roomId, user) {
        this.logger.log(`Obteniendo mensajes para sala ${roomId} (usuario: ${user.email})`);
        // Lógica de verificación de acceso (ya existente)
        if (roomId.startsWith('class-')) {
            const classId = roomId.replace(/^class-/, '');
            const classEntity = await this.classRepository.findOneBy({ id: classId }); // Cache or ensure loaded
            if (!classEntity)
                throw new common_1.NotFoundException(`Clase ${classId} no encontrada`);
            const enrollment = await this.classEnrollmentRepository.findOne({
                where: { userId: user.id, classId: classId }, // classId directo aquí
            });
            if (!enrollment && classEntity.teacherId !== user.id) { // Asume que classEntity.teacherId existe
                throw new common_1.ForbiddenException(`No tienes acceso a esta clase`);
            }
        }
        else if (roomId.startsWith('dm-')) {
            const participants = roomId.replace(/^dm-/, '').split('-');
            if (!participants.includes(user.id)) {
                throw new common_1.ForbiddenException(`No tienes acceso a esta conversación`);
            }
        }
        else {
            throw new common_1.BadRequestException("Formato de roomId desconocido.");
        }
        const messages = await this.messageRepository.find({
            where: { roomId },
            relations: ['sender'], // Para acceder a sender.firstName, sender.lastName
            order: { timestamp: 'ASC' },
        });
        return messages.map(message => ({
            id: message.id,
            content: message.content,
            timestamp: message.timestamp,
            roomId: message.roomId,
            senderId: message.sender?.id, // Añadir ? por si sender no se carga
            senderName: message.sender ? `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() || message.sender.email : 'Desconocido',
        }));
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(class_entity_1.Class)),
    __param(3, (0, typeorm_1.InjectRepository)(class_enrollment_entity_1.ClassEnrollment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ChatService);
//# sourceMappingURL=chat.service.js.map