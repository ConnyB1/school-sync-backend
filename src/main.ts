import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap'); 

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  logger.log(`CORS habilitado para origen: http://localhost:8080'}`);

  app.setGlobalPrefix('api');
  logger.log('Prefijo global de API establecido en "/api"');

  app.useGlobalPipes(new ValidationPipe({
     whitelist: true,
     forbidNonWhitelisted: true, 
     transform: true, 
  }));
  logger.log('Global ValidationPipe habilitado');

  const port = process.env.PORT || 5000;
  app.enableCors();
  await app.listen(port, '0.0.0.0');
  const url = `http://localhost:${port}`;
  console.log(`La aplicación está corriendo en: ${url}`);
  console.log(`Escuchando en el puerto ${port}`);
  console.log(`CORS habilitado para origen: http://localhost:8080`); 
  console.log(`Prefijo global de API establecido en "/api"`);

}
bootstrap();