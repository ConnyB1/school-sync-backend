// proyecto/school-sync-backend/src/announcements/announcements.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { Announcement } from './announcement.entity';
import { UsersModule } from '../users/users.module';
import { ClassesModule } from '../classes/classes.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Announcement]),
    forwardRef(() => UsersModule),
    forwardRef(() => ClassesModule),
    AuthModule,
  ],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}