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
exports.ClassEnrollment = void 0;
// proyecto/school-sync-backend/src/class-enrollments/class-enrollment.entity.ts
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const class_entity_1 = require("../classes/class.entity");
let ClassEnrollment = class ClassEnrollment {
    id;
    userId;
    classId;
    user;
    class;
    createdAt;
    updatedAt;
};
exports.ClassEnrollment = ClassEnrollment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ClassEnrollment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], ClassEnrollment.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'class_id' }),
    __metadata("design:type", String)
], ClassEnrollment.prototype, "classId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.enrollments),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], ClassEnrollment.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => class_entity_1.Class, classEntity => classEntity.studentEnrollments),
    (0, typeorm_1.JoinColumn)({ name: 'class_id' }),
    __metadata("design:type", class_entity_1.Class)
], ClassEnrollment.prototype, "class", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ClassEnrollment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ClassEnrollment.prototype, "updatedAt", void 0);
exports.ClassEnrollment = ClassEnrollment = __decorate([
    (0, typeorm_1.Entity)('class_enrollments'),
    (0, typeorm_1.Unique)(['userId', 'classId'])
], ClassEnrollment);
//# sourceMappingURL=class-enrollment.entity.js.map