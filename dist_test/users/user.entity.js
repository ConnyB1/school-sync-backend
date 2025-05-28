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
exports.User = exports.UserRole = void 0;
// proyecto/school-sync-backend/src/users/user.entity.ts
const typeorm_1 = require("typeorm");
const class_enrollment_entity_1 = require("../class-enrollments/class-enrollment.entity");
const announcement_entity_1 = require("../announcements/announcement.entity");
const class_entity_1 = require("../classes/class.entity");
const message_entity_1 = require("../chat/entities/message.entity");
const assignment_entity_1 = require("../assignments/assignment.entity");
const submission_entity_1 = require("../assignments/submission.entity");
var UserRole;
(function (UserRole) {
    UserRole["Alumno"] = "Alumno";
    UserRole["Profesor"] = "Profesor";
    UserRole["Padre"] = "Padre";
    UserRole["Admin"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
let User = class User {
    id;
    email; // Tipo `string` sin longitud para coincidir con la migración
    password; // Tipo `string` sin longitud para coincidir con la migración
    firstName; // Columna 'firstName'
    lastName; // Columna 'lastName'
    pictureUrl;
    roles;
    // Relaciones
    enrollments;
    sentMessages;
    receivedMessages;
    taughtClasses;
    createdAnnouncements;
    assignments;
    submissions;
    createdAt;
    updatedAt;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ select: false }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'picture_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "pictureUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, default: [] }),
    __metadata("design:type", Array)
], User.prototype, "roles", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => class_enrollment_entity_1.ClassEnrollment, (enrollment) => enrollment.user),
    __metadata("design:type", Array)
], User.prototype, "enrollments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => message_entity_1.Message, (message) => message.sender),
    __metadata("design:type", Array)
], User.prototype, "sentMessages", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => message_entity_1.Message, (message) => message.recipient),
    __metadata("design:type", Array)
], User.prototype, "receivedMessages", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => class_entity_1.Class, (classEntity) => classEntity.teacher),
    __metadata("design:type", Array)
], User.prototype, "taughtClasses", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => announcement_entity_1.Announcement, (announcement) => announcement.author),
    __metadata("design:type", Array)
], User.prototype, "createdAnnouncements", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => assignment_entity_1.Assignment, (assignment) => assignment.teacher),
    __metadata("design:type", Array)
], User.prototype, "assignments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => submission_entity_1.Submission, (submission) => submission.student),
    __metadata("design:type", Array)
], User.prototype, "submissions", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('usuarios')
], User);
//# sourceMappingURL=user.entity.js.map