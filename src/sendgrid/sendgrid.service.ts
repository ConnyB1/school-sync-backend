// proyecto/school-sync-backend/src/sendgrid/sendgrid.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail'; // Cambio en la sintaxis de importación

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);
  private verifiedSender: string;

  constructor(private configService: ConfigService) {
    // Correcto: Leer la variable de entorno llamada SENDGRID_API_KEY
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.verifiedSender = this.configService.get<string>('SENDGRID_VERIFIED_SENDER') ?? 'schoolsync.real@gmail.com'; // Ya lo tenías bien.

    if (!apiKey) {
      this.logger.warn('SENDGRID_API_KEY no está configurada en las variables de entorno. El servicio de correo no funcionará.');
    } else {
      sgMail.setApiKey(apiKey);
      this.logger.log('Servicio SendGrid configurado.');
    }
    if (!this.verifiedSender) {
        this.logger.warn('SENDGRID_VERIFIED_SENDER no está configurado. Se usará un placeholder o podría fallar el envío.');
        // Considera un default más seguro o lanzar error si es crítico
        this.verifiedSender = 'schoolsync.real@gmail.com';
    }
  }

  async sendEmail(to: string, subject: string, text: string, html: string): Promise<void> {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY'); // Get it again or store a flag in the constructor
    if (!apiKey) {
        this.logger.error('API Key de SendGrid no configurada en las variables de entorno. No se puede enviar correo.');
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