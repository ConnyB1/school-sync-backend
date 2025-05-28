// proyecto/school-sync-backend/src/data-source.ts
import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './users/user.entity';
import { Class } from './classes/class.entity';
import { Assignment } from './assignments/assignment.entity';
import { Submission } from './assignments/submission.entity';
import { Announcement } from './announcements/announcement.entity';
import { Message } from './chat/entities/message.entity';
import { ClassEnrollment } from './class-enrollments/class-enrollment.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: process.env.DB_TYPE as any || 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: true,
  synchronize: false, // ¡IMPORTANTE! False en producción, solo true para desarrollo inicial o test.
  logging: true, // Para ver las queries de TypeORM
  entities: [User, Class, Assignment, Submission, Announcement, Message, ClassEnrollment], // Asegúrate de que todas tus entidades estén aquí
  migrations: [__dirname + '/migrations/**/*.ts'], // Ruta a tus archivos de migración
  subscribers: [],
});