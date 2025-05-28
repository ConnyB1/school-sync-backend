import { Repository } from 'typeorm';
import { Announcement } from './announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UsersService } from '../users/users.service';
import { ClassesService } from '../classes/classes.service';
import { SendGridService } from '../sendgrid/sendgrid.service';
export declare class AnnouncementsService {
    private announcementsRepository;
    private readonly usersService;
    private readonly classesService;
    private readonly sendgridService;
    private readonly logger;
    constructor(announcementsRepository: Repository<Announcement>, usersService: UsersService, classesService: ClassesService, sendgridService: SendGridService);
    findAll(): Promise<Announcement[]>;
    findAllByClass(classId: string, userId: string): Promise<Announcement[]>;
    create(createAnnouncementDto: CreateAnnouncementDto, authorId: string): Promise<Announcement>;
    findOneById(id: string): Promise<Announcement>;
}
