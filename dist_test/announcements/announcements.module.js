"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnouncementsModule = void 0;
// proyecto/school-sync-backend/src/announcements/announcements.module.ts
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const announcement_entity_1 = require("./announcement.entity");
const announcements_service_1 = require("./announcements.service");
const announcements_controller_1 = require("./announcements.controller");
const users_module_1 = require("../users/users.module"); // Importa UsersModule si no lo has hecho
const classes_module_1 = require("../classes/classes.module"); // Importa ClassesModule si no lo has hecho
const sendgrid_module_1 = require("../sendgrid/sendgrid.module"); // <--- AGREGADO
let AnnouncementsModule = class AnnouncementsModule {
};
exports.AnnouncementsModule = AnnouncementsModule;
exports.AnnouncementsModule = AnnouncementsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([announcement_entity_1.Announcement]),
            (0, common_1.forwardRef)(() => users_module_1.UsersModule), // Para evitar circular dependency si UsersService usa ClassesService
            (0, common_1.forwardRef)(() => classes_module_1.ClassesModule), // Para evitar circular dependency si ClassesService usa AnnouncementsService
            sendgrid_module_1.SendGridModule, // <--- AGREGADO
        ],
        providers: [announcements_service_1.AnnouncementsService],
        controllers: [announcements_controller_1.AnnouncementsController],
        exports: [announcements_service_1.AnnouncementsService], // Exporta si AnnouncementsService es usado por otros módulos
    })
], AnnouncementsModule);
//# sourceMappingURL=announcements.module.js.map