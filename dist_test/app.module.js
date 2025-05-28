"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
// proyecto/school-sync-backend/src/app.module.ts
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const classes_module_1 = require("./classes/classes.module");
const sendgrid_module_1 = require("./sendgrid/sendgrid.module");
const chat_module_1 = require("./chat/chat.module");
const announcements_module_1 = require("./announcements/announcements.module");
const assignments_module_1 = require("./assignments/assignments.module");
const serve_static_1 = require("@nestjs/serve-static"); // Importar ServeStaticModule
const path_1 = require("path");
const user_entity_1 = require("./users/user.entity");
const announcement_entity_1 = require("./announcements/announcement.entity");
const class_entity_1 = require("./classes/class.entity");
const class_enrollment_entity_1 = require("./class-enrollments/class-enrollment.entity");
const message_entity_1 = require("./chat/entities/message.entity");
const assignment_entity_1 = require("./assignments/assignment.entity");
const submission_entity_1 = require("./assignments/submission.entity"); // Importar la entidad Submission
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('DB_HOST', 'localhost'),
                    port: configService.get('DB_PORT', 5432),
                    username: configService.get('DB_USERNAME', 'postgres'),
                    password: configService.get('DB_PASSWORD', '321'),
                    database: configService.get('DB_NAME', 'schoolsyn-database'),
                    entities: [
                        user_entity_1.User,
                        announcement_entity_1.Announcement,
                        class_entity_1.Class,
                        class_enrollment_entity_1.ClassEnrollment,
                        message_entity_1.Message,
                        assignment_entity_1.Assignment,
                        submission_entity_1.Submission, // Asegúrate de que Submission esté aquí
                    ],
                    synchronize: false, // Controlado por migrations
                    migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
                    migrationsRun: process.env.NODE_ENV === 'production',
                    logging: process.env.NODE_ENV !== 'production',
                }),
                inject: [config_1.ConfigService],
            }),
            // ServeStaticModule debe ser un import de módulo directo en el array imports principal, no dentro de TypeOrmModule.forRootAsync.
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'uploads'), // Ruta donde se encuentran los archivos subidos
                serveRoot: '/uploads', // Prefijo de URL para acceder a los archivos (ej: http://localhost:3000/uploads/mi-archivo.pdf)
            }),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            announcements_module_1.AnnouncementsModule,
            assignments_module_1.AssignmentsModule,
            classes_module_1.ClassesModule,
            sendgrid_module_1.SendGridModule,
            chat_module_1.ChatModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map