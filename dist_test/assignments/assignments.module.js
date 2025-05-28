"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentsModule = void 0;
// proyecto/school-sync-backend/src/assignments/assignments.module.ts
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const assignments_service_1 = require("./assignments.service");
const assignments_controller_1 = require("./assignments.controller");
const assignment_entity_1 = require("./assignment.entity");
const submission_entity_1 = require("./submission.entity");
const auth_module_1 = require("../auth/auth.module");
const users_module_1 = require("../users/users.module");
const class_entity_1 = require("../classes/class.entity"); // Importar la entidad Class
let AssignmentsModule = class AssignmentsModule {
};
exports.AssignmentsModule = AssignmentsModule;
exports.AssignmentsModule = AssignmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([assignment_entity_1.Assignment, submission_entity_1.Submission, class_entity_1.Class]), // <-- Asegúrate de que 'Class' esté aquí
            (0, common_1.forwardRef)(() => auth_module_1.AuthModule),
            (0, common_1.forwardRef)(() => users_module_1.UsersModule),
        ],
        providers: [assignments_service_1.AssignmentsService],
        controllers: [assignments_controller_1.AssignmentsController],
        exports: [assignments_service_1.AssignmentsService],
    })
], AssignmentsModule);
//# sourceMappingURL=assignments.module.js.map