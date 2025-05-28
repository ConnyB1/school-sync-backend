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
exports.Assignment = void 0;
// proyecto/school-sync-backend/src/assignments/assignment.entity.ts
const typeorm_1 = require("typeorm");
const class_entity_1 = require("../classes/class.entity");
const user_entity_1 = require("../users/user.entity");
const submission_entity_1 = require("./submission.entity");
let Assignment = class Assignment {
    id;
    title;
    description;
    dueDate;
    class;
    classId;
    teacher;
    teacherId;
    // Propiedad para la URL del archivo adjunto
    // Ahora permite 'string', 'undefined' o 'null'
    assignmentFileUrl; // <-- CAMBIO CRUCIAL AQUÍ
    submissions;
    createdAt;
    updatedAt;
};
exports.Assignment = Assignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Assignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: false }),
    __metadata("design:type", String)
], Assignment.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], Assignment.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Assignment.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => class_entity_1.Class, (cls) => cls.assignments, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'class_id' }),
    __metadata("design:type", class_entity_1.Class)
], Assignment.prototype, "class", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'class_id', nullable: false }),
    __metadata("design:type", String)
], Assignment.prototype, "classId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.assignments, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'teacher_id' }),
    __metadata("design:type", user_entity_1.User)
], Assignment.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'teacher_id', nullable: true }),
    __metadata("design:type", String)
], Assignment.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assignment_file_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Assignment.prototype, "assignmentFileUrl", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => submission_entity_1.Submission, (submission) => submission.assignment),
    __metadata("design:type", Array)
], Assignment.prototype, "submissions", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Assignment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Assignment.prototype, "updatedAt", void 0);
exports.Assignment = Assignment = __decorate([
    (0, typeorm_1.Entity)('assignments')
], Assignment);
//# sourceMappingURL=assignment.entity.js.map