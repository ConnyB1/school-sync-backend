// proyecto/school-sync-backend/src/sendgrid/sendgrid.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);
  private verifiedSender: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('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');
    this.verifiedSender = this.configService.get<string>('SENDGRID_VERIFIED_SENDER') ?? 'schoolsync.real@gmail.com'; // Ej: 'no-reply@tuschoolsync.com'

    if (!apiKey) {
      this.logger.warn('SENDGRID_API_KEY no está configurada. El servicio de correo no funcionará.');
    } else {
      sgMail.setApiKey(apiKey);
      this.logger.log('Servicio SendGrid configurado.');
    }
    if (!this.verifiedSender) {
        this.logger.warn('SENDGRID_VERIFIED_SENDER no está configurado. Se usará un placeholder.');
        this.verifiedSender = 'schoolsync.real@gmail.com';
    }
  }

  async sendEmail(to: string, subject: string, text: string, html: string): Promise<void> {
    if (!sgMail.setApiKey) {
         this.logger.error('API Key de SendGrid no configurada. No se puede enviar correo.');
         return;
    }
    const msg = {
      to,
      from: this.verifiedSender, // DEBE ser un remitente verificado en SendGrid
      subject,
      text,
      html,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Correo enviado a <span class="math-inline">\{to\} con asunto "</span>{subject}"`);
    } catch (error) {
      this.logger.error(`Error enviando correo a ${to}:`, error.response?.body || error.message);
      // Considera no relanzar el error para no detener el flujo principal,
      // o manejarlo específicamente si el envío de correo es crítico.
    }
  }

  async sendClassInvitationEmail(email: string, className: string, accessCode: string, teacherName: string) {
    const subject = `Invitación a la clase: ${className}`;
    const text = `Hola,\n\nHas sido invitado a unirte a la clase "${className}" impartida por ${teacherName}.\nUsa el siguiente código de acceso para unirte: ${accessCode}\n\nGracias,\nEl equipo de SchoolSync`;
    const html = `
      <p>Hola,</p>
      <p>Has sido invitado a unirte a la clase "<strong><span class="math-inline">\{className\}</strong\>" impartida por <strong\></span>{teacherName}</strong>.</p>
      <p>Usa el siguiente código de acceso para unirte: <strong>${accessCode}</strong></p>
      <p>Puedes ingresar a la plataforma y usar el código para unirte a la clase.</p>
      <p>Gracias,<br>El equipo de SchoolSync</p>
    `;
    await this.sendEmail(email, subject, text, html);
  }
}