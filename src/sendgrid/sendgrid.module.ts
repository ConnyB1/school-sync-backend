// proyecto/school-sync-backend/src/sendgrid/sendgrid.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SendGridService } from './sendgrid.service';

@Global() // Hace el servicio disponible globalmente si lo necesitas en muchos módulos
@Module({
  imports: [ConfigModule], // ConfigModule ya es global desde AppModule
  providers: [SendGridService],
  exports: [SendGridService],
})
export class SendGridModule {}