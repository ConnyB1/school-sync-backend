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
        host: configService.get<string>('DB_HOST'), // Se tomará de tus variables de entorno
        port: configService.get<number>('DB_PORT'),       // Se tomará de tus variables de entorno
        username: configService.get<string>('DB_USERNAME'), // Se tomará de tus variables de entorno
        password: configService.get<string>('DB_PASSWORD'), // Se tomará de tus variables de entorno
        database: configService.get<string>('DB_NAME'),     // Se tomará de tus variables de entorno

        ssl: true, // <--- ¡AÑADE ESTO AQUÍ! Es crucial para Supabase.
                  // Alternativamente: ssl: { rejectUnauthorized: false } si tienes problemas de certificado, pero es menos seguro.

        entities: [
          User,
          Announcement,
          Class,
          ClassEnrollment,
          Message,
          Assignment,
          Submission,
        ],
        synchronize: false, // Correcto para producción, las migraciones se encargan del esquema.
        migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
        migrationsRun: process.env.NODE_ENV === 'production', // Tus migraciones se ejecutarán en producción.
        logging: process.env.NODE_ENV !== 'production',
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'), 
      serveRoot: '/uploads', 
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