// proyecto/school-sync-backend/src/sendgrid/sendgrid.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

interface MailData {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);
  private verifiedSender: string;
  private apiKeyConfigured = false; // Bandera para saber si la API Key está configurada

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.verifiedSender = this.configService.get<string>('SENDGRID_VERIFIED_SENDER') ?? 'schoolsync.real@gmail.com';

    if (!apiKey) {
      this.logger.warn('SENDGRID_API_KEY no está configurada en las variables de entorno. El servicio de correo no funcionará.');
    } else {
      sgMail.setApiKey(apiKey);
      this.apiKeyConfigured = true; // Establecer la bandera a true si la API Key existe
      this.logger.log('Servicio SendGrid configurado.');
    }
    if (!this.verifiedSender) {
        this.logger.warn('SENDGRID_VERIFIED_SENDER no está configurado. Se usará un placeholder o podría fallar el envío.');
        this.verifiedSender = 'schoolsync.real@gmail.com';
    }
  }

  async sendMail(mailData: MailData): Promise<void> {
    if (!this.apiKeyConfigured) {
        this.logger.error('API Key de SendGrid no configurada. No se puede enviar correo.');
        return; 
    }
    const msg = {
      to: mailData.to,
      from: this.verifiedSender, // DEBE ser un remitente verificado en SendGrid
      subject: mailData.subject,
      text: mailData.text,
      html: mailData.html,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Correo enviado a ${Array.isArray(mailData.to) ? mailData.to.join(', ') : mailData.to} con asunto "${mailData.subject}"`);
    } catch (error) {
      this.logger.error(`Error enviando correo a ${Array.isArray(mailData.to) ? mailData.to.join(', ') : mailData.to}:`, error.response?.body || error.message);
    }
  }

  async sendClassInvitationEmail(email: string, className: string, accessCode: string, teacherName: string) {
    const subject = `Invitación a la clase: ${className}`;
    const text = `Hola,\n\nHas sido invitado a unirte a la clase "${className}" impartida por ${teacherName}.\nUsa el siguiente código de acceso para unirte: ${accessCode}\n\nGracias,\nEl equipo de SchoolSync`;
    const html = `
      <p>Hola,</p>
      <p>Has sido invitado a unirte a la clase "<strong>${className}</strong>" impartida por <strong>${teacherName}</strong>.</p>
      <p>Usa el siguiente código de acceso para unirte: <strong>${accessCode}</strong></p>
      <p>Puedes ingresar a la plataforma y usar el código para unirte a la clase.</p>
      <p>Gracias,<br>El equipo de SchoolSync</p>
    `;
    await this.sendMail({ to: email, subject, text, html });
  }
} 