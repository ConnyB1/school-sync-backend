"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
// proyecto/school-sync-backend/src/chat/chat.module.ts
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const chat_service_1 = require("./chat.service");
const message_entity_1 = require("./entities/message.entity");
const auth_module_1 = require("../auth/auth.module");
const users_module_1 = require("../users/users.module");
const user_entity_1 = require("../users/user.entity");
const class_entity_1 = require("../classes/class.entity");
const class_enrollment_entity_1 = require("../class-enrollments/class-enrollment.entity"); // <--- AÑADE ESTA IMPORTACIÓN
const chat_gateway_1 = require("./chat.gateway");
const chat_controller_1 = require("./chat.controller");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                message_entity_1.Message,
                user_entity_1.User,
                class_entity_1.Class,
                class_enrollment_entity_1.ClassEnrollment // <--- AÑADE ClassEnrollment AQUÍ
            ]),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
        ],
        providers: [
            chat_gateway_1.ChatGateway,
            chat_service_1.ChatService,
        ],
        exports: [chat_service_1.ChatService],
        controllers: [chat_controller_1.ChatController],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map