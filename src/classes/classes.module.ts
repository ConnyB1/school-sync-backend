// proyecto/school-sync-backend/src/classes/classes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { Class } from './class.entity';
import { User } from '../users/user.entity'; // Importar User ya que ClassesService lo inyecta
import { UsersModule } from '../users/users.module'; // Importar UsersModule para poder inyectar UsersService

// SendGridModule ya debería ser global (configurado en AppModule) o importado en AppModule
// por lo que normalmente no necesitas importarlo aquí explícitamente.

@Module({
  imports: [
    // Registra las entidades Class y User para que sus repositorios estén disponibles
    // dentro de este módulo (específicamente para ClassesService).
    TypeOrmModule.forFeature([Class, User]),

    // Importa UsersModule para que ClassesService pueda inyectar y usar UsersService.
    UsersModule,
  ],
  // Declara el controlador que pertenece a este módulo.
  controllers: [ClassesController],
  // Declara el servicio que pertenece a este módulo y que será instanciado por NestJS.
  providers: [ClassesService],
  // Opcional: Exporta el servicio si planeas inyectar ClassesService en otros módulos.
  exports: [ClassesService],
})
export class ClassesModule {}