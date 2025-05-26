// proyecto/school-sync-backend/src/data-source.ts
import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

import { User } from './users/user.entity';
import { Announcement } from './announcements/announcement.entity';
import { Class } from './classes/class.entity';
import { ClassEnrollment } from './class-enrollments/class-enrollment.entity';
import { Message } from './chat/entities/message.entity';
import { Assignment } from './assignments/assignment.entity'; // FIXED: Importar Assignment
import { Submission } from './assignments/submission.entity'; // FIXED: Importar Submission

config(); // Cargar variables de entorno desde .env

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '321',
  database: process.env.DB_NAME || 'schoolsyn-database',
  entities: [
    User,
    Announcement,
    Class,
    ClassEnrollment,
    Message,
    Assignment, // FIXED: Añadir Assignment a entities
    Submission, // FIXED: Añadir Submission a entities
  ],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')], // Asegura que las migraciones se carguen correctamente
  synchronize: false, // Nunca uses synchronize en producción
  logging: true,
};

const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource;