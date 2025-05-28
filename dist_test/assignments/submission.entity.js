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
exports.Submission = void 0;
// proyecto/school-sync-backend/src/assignments/submission.entity.ts
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const assignment_entity_1 = require("./assignment.entity");
let Submission = class Submission {
    id;
    assignment;
    assignmentId;
    student;
    studentId;
    // Propiedades añadidas/corregidas
    filePath;
    submissionDate;
    grade;
    feedback;
    createdAt;
    updatedAt;
};
exports.Submission = Submission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Submission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => assignment_entity_1.Assignment, assignment => assignment.submissions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'assignmentId' }),
    __metadata("design:type", assignment_entity_1.Assignment)
], Submission.prototype, "assignment", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Submission.prototype, "assignmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.submissions),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", user_entity_1.User)
], Submission.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Submission.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }) // filePath es opcional si la entrega no tiene archivo
    ,
    __metadata("design:type", String)
], Submission.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Submission.prototype, "submissionDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }) // Calificación puede ser nula antes de calificar
    ,
    __metadata("design:type", Number)
], Submission.prototype, "grade", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }) // Comentarios pueden ser nulos
    ,
    __metadata("design:type", String)
], Submission.prototype, "feedback", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Submission.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Submission.prototype, "updatedAt", void 0);
exports.Submission = Submission = __decorate([
    (0, typeorm_1.Entity)('submissions')
], Submission);
//# sourceMappingURL=submission.entity.js.map