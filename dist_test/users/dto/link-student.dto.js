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
exports.LinkStudentDto = void 0;
// src/users/dto/link-student.dto.ts (Modificado)
const class_validator_1 = require("class-validator");
class LinkStudentDto {
    studentId; // Cambiado de studentAuth0Id
}
exports.LinkStudentDto = LinkStudentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)('4', { message: 'El ID del alumno debe ser un UUID válido.' }) // Asumiendo que usas UUIDs
    ,
    __metadata("design:type", String)
], LinkStudentDto.prototype, "studentId", void 0);
//# sourceMappingURL=link-student.dto.js.map