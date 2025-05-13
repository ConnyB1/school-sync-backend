import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
    constructor(private readonly announcementsService: AnnouncementsService) {}

    @Get()
    findAll() {
        return this.announcementsService.findAll();
    }
}