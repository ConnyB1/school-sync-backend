import { User } from '../users/user.entity';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { Announcement } from './announcement.entity';
export declare class AnnouncementsController {
    private readonly announcementsService;
    private readonly logger;
    constructor(announcementsService: AnnouncementsService);
    findAllByClass(classId: string, req: {
        user: User;
    }): Promise<Announcement[]>;
    create(createAnnouncementDto: CreateAnnouncementDto, req: {
        user: User;
    }): Promise<Announcement>;
    findAll(req: {
        user: User;
    }): Promise<Announcement[]>;
}
