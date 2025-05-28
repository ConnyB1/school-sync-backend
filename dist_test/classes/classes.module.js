"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassesModule = void 0;
// proyecto/school-sync-backend/src/classes/classes.module.ts
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const classes_service_1 = require("./classes.service");
const classes_controller_1 = require("./classes.controller");
const class_entity_1 = require("./class.entity");
const user_entity_1 = require("../users/user.entity");
const users_module_1 = require("../users/users.module");
const class_enrollment_entity_1 = require("../class-enrollments/class-enrollment.entity");
const sendgrid_module_1 = require("../sendgrid/sendgrid.module");
const auth_module_1 = require("../auth/auth.module");
const assignment_entity_1 = require("../assignments/assignment.entity");
let ClassesModule = class ClassesModule {
};
exports.ClassesModule = ClassesModule;
exports.ClassesModule = ClassesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([class_entity_1.Class, user_entity_1.User, class_enrollment_entity_1.ClassEnrollment, assignment_entity_1.Assignment]),
            (0, common_1.forwardRef)(() => users_module_1.UsersModule),
            sendgrid_module_1.SendGridModule,
            auth_module_1.AuthModule,
        ],
        controllers: [classes_controller_1.ClassesController],
        providers: [classes_service_1.ClassesService],
        exports: [classes_service_1.ClassesService],
    })
], ClassesModule);
//# sourceMappingURL=classes.module.js.map