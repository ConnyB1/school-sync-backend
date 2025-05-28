"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
// proyecto/school-sync-backend/src/data-source.ts
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const dotenv = __importStar(require("dotenv"));
const user_entity_1 = require("./users/user.entity");
const class_entity_1 = require("./classes/class.entity");
const assignment_entity_1 = require("./assignments/assignment.entity");
const submission_entity_1 = require("./assignments/submission.entity");
const announcement_entity_1 = require("./announcements/announcement.entity");
const message_entity_1 = require("./chat/entities/message.entity");
const class_enrollment_entity_1 = require("./class-enrollments/class-enrollment.entity");
dotenv.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: process.env.DB_TYPE || 'postgres', // o 'mysql', 'sqlite', etc.
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'your_password',
    database: process.env.DB_NAME || 'schools-db',
    synchronize: false, // ¡IMPORTANTE! False en producción, solo true para desarrollo inicial o test.
    logging: true, // Para ver las queries de TypeORM
    entities: [user_entity_1.User, class_entity_1.Class, assignment_entity_1.Assignment, submission_entity_1.Submission, announcement_entity_1.Announcement, message_entity_1.Message, class_enrollment_entity_1.ClassEnrollment], // Asegúrate de que todas tus entidades estén aquí
    migrations: [__dirname + '/migrations/**/*.ts'], // Ruta a tus archivos de migración
    subscribers: [],
});
//# sourceMappingURL=data-source.js.map