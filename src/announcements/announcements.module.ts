// proyecto/school-sync-backend/src/announcements/announcements.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Announcement } from './announcement.entity';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { UsersModule } from '../users/users.module'; // Importa UsersModule si no lo has hecho
import { ClassesModule } from '../classes/classes.module'; // Importa ClassesModule si no lo has hecho
import { SendGridModule } from '../sendgrid/sendgrid.module'; // <--- AGREGADO

@Module({
  imports: [
    TypeOrmModule.forFeature([Announcement]),
    forwardRef(() => UsersModule), // Para evitar circular dependency si UsersService usa ClassesService
    forwardRef(() => ClassesModule), // Para evitar circular dependency si ClassesService usa AnnouncementsService
    SendGridModule, // <--- AGREGADO
  ],
  providers: [AnnouncementsService],
  controllers: [AnnouncementsController],
  exports: [AnnouncementsService], // Exporta si AnnouncementsService es usado por otros módulos
})
export class AnnouncementsModule {}