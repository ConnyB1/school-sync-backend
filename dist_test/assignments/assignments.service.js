"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AssignmentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentsService = void 0;
// proyecto/school-sync-backend/src/assignments/assignments.service.ts
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const assignment_entity_1 = require("./assignment.entity");
const user_entity_1 = require("../users/user.entity");
const class_entity_1 = require("../classes/class.entity");
const submission_entity_1 = require("./submission.entity");
const users_service_1 = require("../users/users.service");
const uuid_1 = require("uuid");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const fs = __importStar(require("fs"));
const sendgrid_service_1 = require("../sendgrid/sendgrid.service");
let AssignmentsService = AssignmentsService_1 = class AssignmentsService {
    assignmentsRepository;
    submissionsRepository;
    usersService;
    classesRepository;
    sendgridService;
    logger = new common_1.Logger(AssignmentsService_1.name);
    constructor(assignmentsRepository, submissionsRepository, usersService, classesRepository, sendgridService) {
        this.assignmentsRepository = assignmentsRepository;
        this.submissionsRepository = submissionsRepository;
        this.usersService = usersService;
        this.classesRepository = classesRepository;
        this.sendgridService = sendgridService;
    }
    async saveFile(file, folder) {
        const uploadDir = (0, path_1.join)(process.cwd(), 'uploads', folder);
        await (0, promises_1.mkdir)(uploadDir, { recursive: true });
        const fileName = `${(0, uuid_1.v4)()}-${file.originalname}`;
        const filePath = (0, path_1.join)(folder, fileName);
        const fullPath = (0, path_1.join)(uploadDir, fileName);
        try {
            await (0, promises_1.writeFile)(fullPath, file.buffer);
            this.logger.log(`Archivo guardado en: ${fullPath}`);
            return filePath;
        }
        catch (error) {
            this.logger.error(`Error al guardar el archivo: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Error al guardar el archivo.');
        }
    }
    async deleteFile(filePath) {
        const fullPath = (0, path_1.join)(process.cwd(), 'uploads', filePath);
        try {
            if (fs.existsSync(fullPath)) {
                await (0, promises_1.unlink)(fullPath);
                this.logger.log(`Archivo eliminado: ${fullPath}`);
            }
        }
        catch (error) {
            this.logger.warn(`No se pudo eliminar el archivo ${fullPath}: ${error.message}`);
        }
    }
    async createAssignment(createAssignmentDto, teacherId, file) {
        this.logger.log(`Creando tarea para clase ID: ${createAssignmentDto.classId} por profesor ID: ${teacherId}`);
        const teacher = await this.usersService.findOneById(teacherId);
        if (!teacher || (!teacher.roles.includes(user_entity_1.UserRole.Profesor) && !teacher.roles.includes(user_entity_1.UserRole.Admin))) {
            throw new common_1.ForbiddenException('Solo los profesores o administradores pueden crear tareas.');
        }
        const classEntity = await this.classesRepository.findOne({
            where: { id: createAssignmentDto.classId },
            relations: ['teacher', 'studentEnrollments', 'studentEnrollments.user'],
        });
        if (!classEntity) {
            throw new common_1.NotFoundException(`Clase con ID ${createAssignmentDto.classId} no encontrada.`);
        }
        if (classEntity.teacherId !== teacherId) {
            throw new common_1.ForbiddenException('No tienes permiso para crear tareas en esta clase.');
        }
        const newAssignment = this.assignmentsRepository.create({
            ...createAssignmentDto,
            teacher: teacher,
            class: classEntity,
        });
        if (file) {
            newAssignment.assignmentFileUrl = await this.saveFile(file, 'assignments');
        }
        try {
            const savedAssignment = await this.assignmentsRepository.save(newAssignment);
            this.logger.log(`Tarea creada con ID: ${savedAssignment.id}`);
            // --- Envío de correo electrónico para nueva tarea ---
            const studentEmails = classEntity.studentEnrollments
                .map(enrollment => enrollment.user?.email)
                .filter(email => email);
            if (studentEmails.length > 0) {
                const subject = `Nueva Tarea en ${classEntity.name}: ${savedAssignment.title}`;
                // <--- NUEVA CONSTANTE
                const dueDateString = savedAssignment.dueDate
                    ? new Date(savedAssignment.dueDate).toLocaleDateString()
                    : 'No especificada';
                const text = `
          Hola,

          El profesor ${teacher.firstName} ${teacher.lastName} ha publicado una nueva tarea en la clase "${classEntity.name}":

          Título: ${savedAssignment.title}
          Descripción: ${savedAssignment.description}
          Fecha de Entrega: ${dueDateString} // <--- MODIFICADO

          Por favor, revisa la plataforma SchoolSync para más detalles y para subir tu entrega.

          Saludos,
          El equipo de SchoolSync
        `;
                await this.sendgridService.sendMail({
                    to: studentEmails,
                    subject: subject,
                    text: text,
                    html: `<p>Hola,</p>
                <p>El profesor <strong>${teacher.firstName} ${teacher.lastName}</strong> ha publicado una nueva tarea en la clase "<strong>${classEntity.name}</strong>":</p>
                <h3>${savedAssignment.title}</h3>
                <p>${savedAssignment.description}</p>
                <p><strong>Fecha de Entrega:</strong> ${dueDateString}</p> // <--- MODIFICADO
                <p>Por favor, revisa la plataforma SchoolSync para más detalles y para subir tu entrega.</p>
                <p>Saludos,<br/>El equipo de SchoolSync</p>`,
                });
                this.logger.log(`Notificación de nueva tarea enviada a ${studentEmails.length} estudiantes.`);
            }
            else {
                this.logger.log('No hay estudiantes matriculados en la clase para enviar la notificación de tarea.');
            }
            // ----------------------------------------------------
            return savedAssignment;
        }
        catch (error) {
            this.logger.error(`Error al guardar la nueva tarea o enviar correo: ${error.message}`, error.stack);
            if (newAssignment.assignmentFileUrl) {
                await this.deleteFile(newAssignment.assignmentFileUrl);
            }
            throw new common_1.InternalServerErrorException('Error al crear la tarea.');
        }
    }
    async findAllAssignments(userId) {
        const user = await this.usersService.findOneById(userId);
        if (user.roles.includes(user_entity_1.UserRole.Profesor) || user.roles.includes(user_entity_1.UserRole.Admin)) {
            return this.assignmentsRepository.find({
                where: { teacher: { id: userId } },
                relations: ['class', 'teacher'],
                order: { dueDate: 'ASC' },
            });
        }
        else if (user.roles.includes(user_entity_1.UserRole.Alumno)) {
            const enrolledClasses = await this.classesRepository.find({
                where: { studentEnrollments: { user: { id: userId } } },
                relations: ['assignments', 'assignments.teacher'],
            });
            const assignments = enrolledClasses.flatMap(cls => cls.assignments);
            return assignments;
        }
        return [];
    }
    async findAllByClassId(classId, userId) {
        this.logger.log(`Buscando tareas para clase ID: ${classId} por usuario ID: ${userId}`);
        const user = await this.usersService.findOneById(userId);
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado.');
        }
        const classEntity = await this.classesRepository.findOne({
            where: { id: classId },
            relations: ['teacher', 'studentEnrollments', 'studentEnrollments.user'],
        });
        if (!classEntity) {
            throw new common_1.NotFoundException(`Clase con ID ${classId} no encontrada.`);
        }
        const isTeacherOfClass = classEntity.teacher?.id === userId;
        const isAdmin = user.roles.includes(user_entity_1.UserRole.Admin);
        const isStudentInClass = classEntity.studentEnrollments.some(enrollment => enrollment.user?.id === userId);
        if (!isTeacherOfClass && !isAdmin && !isStudentInClass) {
            throw new common_1.ForbiddenException('No tienes permiso para ver las tareas de esta clase.');
        }
        return this.assignmentsRepository.find({
            where: { class: { id: classId } },
            relations: ['teacher', 'class'],
            order: { dueDate: 'ASC' },
        });
    }
    async findOneAssignment(assignmentId, userId) {
        this.logger.log(`Buscando tarea ID: ${assignmentId} para usuario ID: ${userId}`);
        const assignment = await this.assignmentsRepository.findOne({
            where: { id: assignmentId },
            relations: ['class', 'teacher', 'class.studentEnrollments', 'class.studentEnrollments.user'],
        });
        if (!assignment) {
            throw new common_1.NotFoundException(`Tarea con ID ${assignmentId} no encontrada.`);
        }
        const user = await this.usersService.findOneById(userId);
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado.');
        }
        const isTeacherOfAssignment = assignment.teacher?.id === userId;
        const isAdmin = user.roles.includes(user_entity_1.UserRole.Admin);
        const isStudentInClass = assignment.class.studentEnrollments.some(enrollment => enrollment.user?.id === userId);
        if (!isTeacherOfAssignment && !isAdmin && !isStudentInClass) {
            throw new common_1.ForbiddenException('No tienes permiso para acceder a esta tarea.');
        }
        return assignment;
    }
    async updateAssignment(id, updateAssignmentDto, teacherId, file) {
        const assignment = await this.assignmentsRepository.findOne({
            where: { id },
            relations: ['teacher'],
        });
        if (!assignment) {
            throw new common_1.NotFoundException(`Tarea con ID ${id} no encontrada.`);
        }
        if (assignment.teacher?.id !== teacherId) {
            throw new common_1.ForbiddenException('No tienes permiso para actualizar esta tarea.');
        }
        if (file) {
            if (assignment.assignmentFileUrl) {
                await this.deleteFile(assignment.assignmentFileUrl);
            }
            assignment.assignmentFileUrl = await this.saveFile(file, 'assignments');
        }
        else if (updateAssignmentDto.assignmentFileUrl === null) {
            if (assignment.assignmentFileUrl) {
                await this.deleteFile(assignment.assignmentFileUrl);
                assignment.assignmentFileUrl = null;
            }
        }
        Object.assign(assignment, updateAssignmentDto);
        return this.assignmentsRepository.save(assignment);
    }
    async removeAssignment(id, teacherId) {
        const assignment = await this.assignmentsRepository.findOne({
            where: { id },
            relations: ['teacher'],
        });
        if (!assignment) {
            throw new common_1.NotFoundException(`Tarea con ID ${id} no encontrada.`);
        }
        if (assignment.teacher?.id !== teacherId) {
            throw new common_1.ForbiddenException('No tienes permiso para eliminar esta tarea.');
        }
        if (assignment.assignmentFileUrl) {
            await this.deleteFile(assignment.assignmentFileUrl);
        }
        await this.assignmentsRepository.remove(assignment);
    }
    async submitAssignment(assignmentId, studentId, file) {
        this.logger.log(`Procesando submission para tarea ${assignmentId} por alumno ${studentId}`);
        const assignment = await this.assignmentsRepository.findOne({
            where: { id: assignmentId },
            relations: ['class', 'class.studentEnrollments', 'class.studentEnrollments.user', 'teacher'],
        });
        if (!assignment) {
            throw new common_1.NotFoundException(`Tarea con ID ${assignmentId} no encontrada.`);
        }
        const student = await this.usersService.findOneById(studentId);
        if (!student || (!student.roles.includes(user_entity_1.UserRole.Alumno) && !student.roles.includes(user_entity_1.UserRole.Admin))) {
            throw new common_1.ForbiddenException('Solo los alumnos o administradores pueden subir tareas.');
        }
        const isEnrolled = assignment.class.studentEnrollments.some(enrollment => enrollment.user?.id === studentId);
        if (!isEnrolled) {
            throw new common_1.ForbiddenException('El alumno no está inscrito en la clase de esta tarea.');
        }
        let submission = await this.submissionsRepository.findOne({
            where: { assignment: { id: assignmentId }, student: { id: studentId } },
        });
        const newFilePath = await this.saveFile(file, 'submissions');
        if (submission) {
            if (submission.filePath) {
                await this.deleteFile(submission.filePath);
            }
            submission.filePath = newFilePath;
            submission.submissionDate = new Date();
            submission.grade = null;
            submission.feedback = null;
        }
        else {
            submission = this.submissionsRepository.create({
                assignment: assignment,
                student: student,
                filePath: newFilePath,
                submissionDate: new Date(),
            });
        }
        try {
            const savedSubmission = await this.submissionsRepository.save(submission);
            this.logger.log(`Entrega de tarea ${assignmentId} por alumno ${studentId} guardada/actualizada.`);
            // --- Envío de correo electrónico para entrega de tarea ---
            const teacherEmail = assignment.teacher?.email;
            if (teacherEmail) {
                const subject = `Nueva Entrega de Tarea: "${assignment.title}" en ${assignment.class.name}`;
                // <--- NUEVA CONSTANTE
                const submissionDateString = savedSubmission.submissionDate
                    ? new Date(savedSubmission.submissionDate).toLocaleDateString()
                    : 'No disponible';
                const text = `
          Hola ${assignment.teacher?.firstName},

          El alumno ${student.firstName} ${student.lastName} ha ${submission.id ? 'actualizado' : 'entregado'} una tarea en tu clase "${assignment.class.name}":

          Tarea: ${assignment.title}
          Fecha de Entrega: ${submissionDateString} // <--- MODIFICADO

          Por favor, revisa la plataforma SchoolSync para calificar la entrega.

          Saludos,
          El equipo de SchoolSync
        `;
                await this.sendgridService.sendMail({
                    to: teacherEmail,
                    subject: subject,
                    text: text,
                    html: `<p>Hola <strong>${assignment.teacher?.firstName}</strong>,</p>
                <p>El alumno <strong>${student.firstName} ${student.lastName}</strong> ha ${submission.id ? 'actualizado' : 'entregado'} una tarea en tu clase "<strong>${assignment.class.name}</strong>":</p>
                <h3>${assignment.title}</h3>
                <p><strong>Fecha de Entrega:</strong> ${submissionDateString}</p> // <--- MODIFICADO
                <p>Por favor, revisa la plataforma SchoolSync para calificar la entrega.</p>
                <p>Saludos,<br/>El equipo de SchoolSync</p>`,
                });
                this.logger.log(`Notificación de entrega de tarea enviada al profesor ${teacherEmail}.`);
            }
            else {
                this.logger.warn('No se encontró el correo electrónico del profesor para enviar la notificación de entrega de tarea.');
            }
            // ----------------------------------------------------
            return savedSubmission;
        }
        catch (error) {
            this.logger.error(`Error al guardar la entrega de tarea o enviar correo: ${error.message}`, error.stack);
            await this.deleteFile(newFilePath);
            throw new common_1.InternalServerErrorException('Error al guardar la entrega de la tarea.');
        }
    }
    async getSubmissionsForAssignment(assignmentId) {
        this.logger.log(`Obteniendo entregas para la tarea ID: ${assignmentId}`);
        const submissions = await this.submissionsRepository.find({
            where: { assignment: { id: assignmentId } },
            relations: ['student', 'assignment'],
        });
        return submissions;
    }
    async getMySubmissionForAssignment(assignmentId, studentId) {
        this.logger.log(`Obteniendo entrega de alumno ${studentId} para tarea ${assignmentId}`);
        const submission = await this.submissionsRepository.findOne({
            where: { assignment: { id: assignmentId }, student: { id: studentId } },
            relations: ['assignment', 'student'],
        });
        if (!submission) {
            throw new common_1.NotFoundException('No se encontró una entrega para esta tarea y alumno.');
        }
        return submission;
    }
    async gradeSubmission(submissionId, grade, feedback, teacherId) {
        this.logger.log(`Calificando entrega ${submissionId} por profesor ${teacherId}`);
        const submission = await this.submissionsRepository.findOne({
            where: { id: submissionId },
            relations: ['assignment', 'assignment.teacher'],
        });
        if (!submission) {
            throw new common_1.NotFoundException(`Entrega con ID ${submissionId} no encontrada.`);
        }
        const teacher = await this.usersService.findOneById(teacherId);
        if (!teacher || (submission.assignment?.teacher?.id !== teacherId && !teacher.roles.includes(user_entity_1.UserRole.Admin))) {
            throw new common_1.ForbiddenException('No tienes permiso para calificar esta entrega.');
        }
        submission.grade = grade;
        submission.feedback = feedback;
        try {
            return await this.submissionsRepository.save(submission);
        }
        catch (error) {
            this.logger.error(`Error al guardar la calificación de la entrega: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Error al calificar la entrega.');
        }
    }
};
exports.AssignmentsService = AssignmentsService;
exports.AssignmentsService = AssignmentsService = AssignmentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(assignment_entity_1.Assignment)),
    __param(1, (0, typeorm_1.InjectRepository)(submission_entity_1.Submission)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => users_service_1.UsersService))),
    __param(3, (0, typeorm_1.InjectRepository)(class_entity_1.Class)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService,
        typeorm_2.Repository,
        sendgrid_service_1.SendGridService])
], AssignmentsService);
//# sourceMappingURL=assignments.service.js.map