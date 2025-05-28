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
exports.CreateMessageDto = void 0;
// proyecto/school-sync-backend/src/chat/dto/create-message.dto.ts
const class_validator_1 = require("class-validator");
const message_entity_1 = require("../entities/message.entity");
class CreateMessageDto {
    content;
    roomId;
    roomType;
    classId; // Solo es relevante si roomType es CLASS
}
exports.CreateMessageDto = CreateMessageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El contenido del mensaje no puede estar vacío.' }),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El ID de la sala (roomId) es requerido.' }),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "roomId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(message_entity_1.RoomType, { message: 'El tipo de sala (roomType) no es válido.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El tipo de sala (roomType) es requerido.' }),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "roomType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'El ID de la clase (classId) debe ser un UUID válido.' }) // Asume que classId es UUID
    ,
    __metadata("design:type", String)
], CreateMessageDto.prototype, "classId", void 0);
//# sourceMappingURL=create-message.dto.js.map