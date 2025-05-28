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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = exports.RoomType = void 0;
// Ubicación: proyecto/school-sync-backend/src/chat/entities/message.entity.ts
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/user.entity"); // Asegúrate que la ruta sea correcta
const class_entity_1 = require("../../classes/class.entity"); // Asegúrate que la ruta sea correcta
var RoomType;
(function (RoomType) {
    RoomType["CLASS"] = "class";
    RoomType["DIRECT"] = "direct";
})(RoomType || (exports.RoomType = RoomType = {}));
let Message = class Message {
    id;
    content;
    timestamp;
    updatedAt;
    // --- Relación con el remitente (User) ---
    sender;
    senderId;
    // --- Identificador de la Sala ---
    roomId; // Ej: 'class_uuid' o 'direct_user1uuid_user2uuid'
    // --- Tipo de Sala ---
    roomType;
    // --- Relación con la Clase (si roomType es 'class') ---
    classInstance; // Propiedad para la instancia de la clase
    classId; // Columna FK para el ID de la clase
    // --- Relación con el destinatario (User) (si roomType es 'direct') ---
    recipient;
    recipientId; // Columna FK para el ID del destinatario
};
exports.Message = Message;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Message.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], Message.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        name: 'timestamp',
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], Message.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({
        name: 'updated_at',
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], Message.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.sentMessages, // Relación en User.entity
    {
        eager: true,
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'sender_id' }) // Nombre de la columna FK en la BD
    ,
    __metadata("design:type", user_entity_1.User)
], Message.prototype, "sender", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sender_id', type: 'uuid' }) // Columna que almacena el ID
    ,
    __metadata("design:type", String)
], Message.prototype, "senderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'room_id', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Message.prototype, "roomId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'room_type',
        type: 'enum',
        enum: RoomType,
    }),
    __metadata("design:type", String)
], Message.prototype, "roomType", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => class_entity_1.Class, (classEntity) => classEntity.messages, // Relación en Class.entity
    {
        nullable: true,
        onDelete: 'SET NULL',
        eager: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'class_id' }),
    __metadata("design:type", class_entity_1.Class)
], Message.prototype, "classInstance", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'class_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Message.prototype, "classId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.receivedMessages, // Relación en User.entity
    {
        nullable: true,
        onDelete: 'SET NULL',
        eager: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'recipient_id' }) // Nombre de la columna FK en la BD
    ,
    __metadata("design:type", user_entity_1.User)
], Message.prototype, "recipient", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'recipient_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Message.prototype, "recipientId", void 0);
exports.Message = Message = __decorate([
    (0, typeorm_1.Entity)('messages')
], Message);
//# sourceMappingURL=message.entity.js.map