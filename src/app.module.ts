import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { ClassesModule } from './classes/classes.module';
import { SendGridModule } from './sendgrid/sendgrid.module';
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
      inject: [ConfigService],  
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true,
        ssl: {
          rejectUnauthorized: false
        }
      }),
    }),
    AuthModule,
    UsersModule,
    AnnouncementsModule,
    ClassesModule,
    SendGridModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}