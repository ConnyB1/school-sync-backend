"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// proyecto/school-sync-backend/src/main.ts
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const path_1 = require("path");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const data_source_1 = require("./data-source");
class CustomIoAdapter extends platform_socket_io_1.IoAdapter {
    createIOServer(port, options) {
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
    const logger = new common_1.Logger('Bootstrap');
    try {
        logger.log('Inicializando conexión a la base de datos...');
        const dataSource = data_source_1.AppDataSource;
        await dataSource.initialize();
        logger.log('Conexión a la base de datos establecida correctamente');
        logger.log('Ejecutando migraciones pendientes...');
        const migrations = await dataSource.runMigrations();
        logger.log(`Se ejecutaron ${migrations.length} migraciones correctamente`);
    }
    catch (error) {
        logger.error('Error al ejecutar migraciones:', error);
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const frontendUrl = configService.get('FRONTEND_URL');
    const allowedOrigins = ['http://localhost:8080'];
    if (frontendUrl && !allowedOrigins.includes(frontendUrl)) {
        allowedOrigins.push(frontendUrl);
        logger.log(`CORS habilitado para orígenes incluyendo: ${frontendUrl}`);
    }
    else {
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
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        exceptionFactory: (errors) => {
            const messages = errors.map(error => Object.values(error.constraints || {}).join(', ')).join('; ');
            return new common_1.BadRequestException(messages);
        },
    }));
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'uploads'), {
        prefix: '/uploads/',
    });
    logger.log(`Sirviendo archivos estáticos desde la ruta /uploads`);
    logger.log('Global ValidationPipe habilitado');
    const port = configService.get('PORT', 3000);
    await app.listen(port, '0.0.0.0');
    logger.log(`✅ Aplicación corriendo en http://localhost:${port}`);
    logger.log(`🚀 API disponible en http://localhost:${port}/api`);
    logger.log(`📱 WebSocket (Socket.IO) disponible en ws://localhost:${port}`);
}
bootstrap().catch(err => {
    const logger = new common_1.Logger('BootstrapError');
    logger.error('❌ Error fatal durante el bootstrap de la aplicación:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map