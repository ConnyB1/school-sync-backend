// proyecto/school-sync-backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClassesModule } from './classes/classes.module';
import { SendGridModule } from './sendgrid/sendgrid.module';
import { ChatModule } from './chat/chat.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { ServeStaticModule } from '@nestjs/serve-static'; // Importar ServeStaticModule
import { join } from 'path';

import { User } from './users/user.entity';
import { Announcement } from './announcements/announcement.entity';
import { Class } from './classes/class.entity';
import { ClassEnrollment } from './class-enrollments/class-enrollment.entity';
import { Message } from './chat/entities/message.entity';
import { Assignment } from './assignments/assignment.entity';
import { Submission } from './assignments/submission.entity'; // Importar la entidad Submission

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', '321'),
        database: configService.get<string>('DB_NAME', 'schoolsyn-database'),
        entities: [
          User,
          Announcement,
          Class,
          ClassEnrollment,
          Message,
          Assignment,
          Submission, // Asegúrate de que Submission esté aquí
        ],
        synchronize: false, // Controlado por migrations
        migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
        migrationsRun: process.env.NODE_ENV === 'production',
        logging: process.env.NODE_ENV !== 'production',
      }),
      inject: [ConfigService],
    }),
    // ServeStaticModule debe ser un import de módulo directo en el array imports principal, no dentro de TypeOrmModule.forRootAsync.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'), // Ruta donde se encuentran los archivos subidos
      serveRoot: '/uploads', // Prefijo de URL para acceder a los archivos (ej: http://localhost:3000/uploads/mi-archivo.pdf)
    }),
    UsersModule,
    AuthModule,
    AnnouncementsModule,
    AssignmentsModule,
    ClassesModule,
    SendGridModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}