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
exports.Class = void 0;
// proyecto/school-sync-backend/src/classes/class.entity.ts
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const class_enrollment_entity_1 = require("../class-enrollments/class-enrollment.entity");
const message_entity_1 = require("../chat/entities/message.entity");
const announcement_entity_1 = require("../announcements/announcement.entity");
const assignment_entity_1 = require("../assignments/assignment.entity");
let Class = class Class {
    id;
    name;
    description;
    classCode;
    teacherId;
    teacher;
    studentEnrollments;
    messages;
    announcements;
    assignments;
    createdAt;
    updatedAt;
};
exports.Class = Class;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Class.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150, nullable: false }),
    __metadata("design:type", String)
], Class.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Class.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'class_code', unique: true, type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Class.prototype, "classCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'teacher_id', type: 'uuid' }),
    __metadata("design:type", String)
], Class.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.taughtClasses),
    (0, typeorm_1.JoinColumn)({ name: 'teacher_id' }),
    __metadata("design:type", user_entity_1.User)
], Class.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => class_enrollment_entity_1.ClassEnrollment, (enrollment) => enrollment.class),
    __metadata("design:type", Array)
], Class.prototype, "studentEnrollments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => message_entity_1.Message, (message) => message.classInstance, { cascade: ['remove'] }),
    __metadata("design:type", Array)
], Class.prototype, "messages", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => announcement_entity_1.Announcement, (announcement) => announcement.class, { cascade: ['remove'] }),
    __metadata("design:type", Array)
], Class.prototype, "announcements", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => assignment_entity_1.Assignment, (assignment) => assignment.class, { cascade: true }),
    __metadata("design:type", Array)
], Class.prototype, "assignments", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Class.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Class.prototype, "updatedAt", void 0);
exports.Class = Class = __decorate([
    (0, typeorm_1.Entity)('classes'),
    (0, typeorm_1.Unique)(['classCode'])
], Class);
//# sourceMappingURL=class.entity.js.map