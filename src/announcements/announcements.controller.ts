import { Controller, Get, Post, Body, Param, Request, UseGuards } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}
  /*
  @Post()
  create(@Body() dto: CreateAnnouncementDto, @Request() req) {
    const userId = req.user.userId;
    return this.announcementsService.create(dto, userId);
  }

  @Get()
  async findAllForUser(@Request() req) {
    const userId = req.user.userId;
    return this.announcementsService.findAllForUser(userId);
  }

  @Get('class/:classId')
  findAllByClass(@Param('classId') classId: string, @Request() req) {
    const userId = req.user.userId;
    return this.announcementsService.findAllByClass(classId, userId);
  }*/
}
