// proyecto/school-sync-backend/src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { Message } from './entities/message.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { User } from '../users/user.entity';
import { Class } from '../classes/class.entity';
import { ClassEnrollment } from '../class-enrollments/class-enrollment.entity'; // <--- AÑADE ESTA IMPORTACIÓN
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
        Message,
        User,
        Class,
        ClassEnrollment // <--- AÑADE ClassEnrollment AQUÍ
    ]),
    AuthModule,
    UsersModule,
  ],
  providers: [
    ChatGateway,
    ChatService,
  ],
  exports: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}