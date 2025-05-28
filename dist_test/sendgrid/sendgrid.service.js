"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var SendGridService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendGridService = void 0;
// proyecto/school-sync-backend/src/sendgrid/sendgrid.service.ts
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mail_1 = __importDefault(require("@sendgrid/mail"));
let SendGridService = SendGridService_1 = class SendGridService {
    configService;
    logger = new common_1.Logger(SendGridService_1.name);
    verifiedSender;
    apiKeyConfigured = false; // Bandera para saber si la API Key está configurada
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('SENDGRID_API_KEY');
        this.verifiedSender = this.configService.get('SENDGRID_VERIFIED_SENDER') ?? 'schoolsync.real@gmail.com';
        if (!apiKey) {
            this.logger.warn('SENDGRID_API_KEY no está configurada en las variables de entorno. El servicio de correo no funcionará.');
        }
        else {
            mail_1.default.setApiKey(apiKey);
            this.apiKeyConfigured = true; // Establecer la bandera a true si la API Key existe
            this.logger.log('Servicio SendGrid configurado.');
        }
        if (!this.verifiedSender) {
            this.logger.warn('SENDGRID_VERIFIED_SENDER no está configurado. Se usará un placeholder o podría fallar el envío.');
            this.verifiedSender = 'schoolsync.real@gmail.com';
        }
    }
    async sendMail(mailData) {
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
            await mail_1.default.send(msg);
            this.logger.log(`Correo enviado a ${Array.isArray(mailData.to) ? mailData.to.join(', ') : mailData.to} con asunto "${mailData.subject}"`);
        }
        catch (error) {
            this.logger.error(`Error enviando correo a ${Array.isArray(mailData.to) ? mailData.to.join(', ') : mailData.to}:`, error.response?.body || error.message);
        }
    }
    async sendClassInvitationEmail(email, className, accessCode, teacherName) {
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
};
exports.SendGridService = SendGridService;
exports.SendGridService = SendGridService = SendGridService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SendGridService);
//# sourceMappingURL=sendgrid.service.js.map