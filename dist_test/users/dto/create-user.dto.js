"use strict";
// src/users/dto/create-user.dto.ts (Alineado con registro local, si se usa directamente)
// PERO ES MEJOR USAR RegisterUserDto de src/auth/dto/register-user.dto.ts y que AuthService lo maneje.
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
exports.CreateUserDto = void 0;
const class_validator_1 = require("class-validator");
const register_user_dto_1 = require("../../auth/dto/register-user.dto"); // Reutilizar UserRole enum
class CreateUserDto {
    email;
    // Si este DTO es para un endpoint que crea usuarios directamente (ej. admin), la contraseña debe ser manejada.
    // Si es para el registro de usuario, AuthService.register se encarga del password.
    password;
    firstName;
    lastName;
    pictureUrl;
    roles;
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'El correo electrónico debe ser válido.' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La contraseña debe ser un texto.' }),
    (0, class_validator_1.MinLength)(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
    (0, class_validator_1.IsOptional)() // Hacerlo opcional aquí si AuthService.register es el principal para nuevos usuarios con contraseña
    ,
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "pictureUrl", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsEnum)(register_user_dto_1.UserRole, { each: true, message: 'Rol inválido.' }),
    (0, class_validator_1.IsOptional)() // Hacerlo opcional aquí si AuthService.register asigna roles por defecto
    ,
    __metadata("design:type", Array)
], CreateUserDto.prototype, "roles", void 0);
//# sourceMappingURL=create-user.dto.js.map