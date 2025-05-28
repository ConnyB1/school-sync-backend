"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendGridModule = void 0;
// proyecto/school-sync-backend/src/sendgrid/sendgrid.module.ts
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sendgrid_service_1 = require("./sendgrid.service");
let SendGridModule = class SendGridModule {
};
exports.SendGridModule = SendGridModule;
exports.SendGridModule = SendGridModule = __decorate([
    (0, common_1.Global)() // Hace el servicio disponible globalmente si lo necesitas en muchos módulos
    ,
    (0, common_1.Module)({
        imports: [config_1.ConfigModule], // ConfigModule ya es global desde AppModule
        providers: [sendgrid_service_1.SendGridService],
        exports: [sendgrid_service_1.SendGridService],
    })
], SendGridModule);
//# sourceMappingURL=sendgrid.module.js.map