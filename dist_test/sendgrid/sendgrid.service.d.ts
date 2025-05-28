import { ConfigService } from '@nestjs/config';
interface MailData {
    to: string | string[];
    subject: string;
    text: string;
    html: string;
}
export declare class SendGridService {
    private configService;
    private readonly logger;
    private verifiedSender;
    private apiKeyConfigured;
    constructor(configService: ConfigService);
    sendMail(mailData: MailData): Promise<void>;
    sendClassInvitationEmail(email: string, className: string, accessCode: string, teacherName: string): Promise<void>;
}
export {};
