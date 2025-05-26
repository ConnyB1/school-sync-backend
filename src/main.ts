// proyecto/school-sync-backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger, HttpStatus, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { IoAdapter } from '@nestjs/platform-socket.io';
import AppDataSource from './data-source';

class CustomIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: ['http://localhost:8080', process.env.FRONTEND_URL],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
      },
      allowEIO3: true,
      transports: ['websocket', 'polling'],
    });
    return server;
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    logger.log('Inicializando conexión a la base de datos...');
    const dataSource = AppDataSource;
    await dataSource.initialize();
    logger.log('Conexión a la base de datos establecida correctamente');
    
    logger.log('Ejecutando migraciones pendientes...');
    const migrations = await dataSource.runMigrations();
    logger.log(`Se ejecutaron ${migrations.length} migraciones correctamente`);
    
  } catch (error) {
    logger.error('Error al ejecutar migraciones:', error);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const frontendUrl = configService.get<string>('FRONTEND_URL');
  const allowedOrigins = ['http://localhost:8080'];

  if (frontendUrl && !allowedOrigins.includes(frontendUrl)) {
    allowedOrigins.push(frontendUrl);
    logger.log(`CORS habilitado para orígenes incluyendo: ${frontendUrl}`);
  } else {
    logger.warn(`La variable FRONTEND_URL no está definida. Usando origen default: ${allowedOrigins.join(', ')}`);
  }

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
  });

  app.useWebSocketAdapter(new CustomIoAdapter(app));

  app.setGlobalPrefix('api');
  logger.log(`Prefijo global de API establecido en "/api"`);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,              
    forbidNonWhitelisted: false,  
    transform: true,              
    exceptionFactory: (errors) => {
      const messages = errors.map(error => 
        Object.values(error.constraints || {}).join(', ')
      ).join('; ');
      return new BadRequestException(messages);
    },
  }));

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  logger.log(`Sirviendo archivos estáticos desde la ruta /uploads`); 
  logger.log('Global ValidationPipe habilitado');

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  logger.log(`✅ Aplicación corriendo en http://localhost:${port}`);
  logger.log(`🚀 API disponible en http://localhost:${port}/api`);
  logger.log(`📱 WebSocket (Socket.IO) disponible en ws://localhost:${port}`);
}

bootstrap().catch(err => {
  const logger = new Logger('BootstrapError');
  logger.error('❌ Error fatal durante el bootstrap de la aplicación:', err);
  process.exit(1);
});