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
var ClassesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassesService = void 0;
// proyecto/school-sync-backend/src/classes/classes.service.ts
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const class_entity_1 = require("./class.entity");
const user_entity_1 = require("../users/user.entity");
const users_service_1 = require("../users/users.service");
const sendgrid_service_1 = require("../sendgrid/sendgrid.service");
const XLSX = __importStar(require("xlsx"));
const class_enrollment_entity_1 = require("../class-enrollments/class-enrollment.entity");
let ClassesService = ClassesService_1 = class ClassesService {
    classesRepository;
    usersService;
    sendgridService;
    classEnrollmentRepository;
    logger = new common_1.Logger(ClassesService_1.name);
    constructor(classesRepository, usersService, sendgridService, classEnrollmentRepository) {
        this.classesRepository = classesRepository;
        this.usersService = usersService;
        this.sendgridService = sendgridService;
        this.classEnrollmentRepository = classEnrollmentRepository;
    }
    generateClassCode(length = 6) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }
    async create(createClassDto, teacherId) {
        this.logger.log(`Intentando crear clase con DTO: ${JSON.stringify(createClassDto)} por profesor ID: ${teacherId}`);
        const teacher = await this.usersService.findOneById(teacherId);
        if (!teacher.roles?.includes(user_entity_1.UserRole.Profesor) &&
            !teacher.roles?.includes(user_entity_1.UserRole.Admin)) {
            throw new common_1.ForbiddenException('Solo los profesores o administradores pueden crear clases.');
        }
        let classCode;
        let existingClassByCode;
        let attempts = 0;
        const maxAttempts = 10;
        do {
            classCode = this.generateClassCode();
            existingClassByCode = await this.classesRepository.findOne({
                where: { classCode },
            });
            attempts++;
            if (attempts > maxAttempts) {
                this.logger.error('No se pudo generar un código de clase único después de varios intentos.');
                throw new common_1.InternalServerErrorException('No se pudo generar un código de clase único.');
            }
        } while (existingClassByCode);
        const newClassPartial = {
            name: createClassDto.name,
            description: createClassDto.description,
            teacherId: teacher.id,
            teacher: teacher,
            classCode: classCode,
        };
        const newClass = this.classesRepository.create(newClassPartial);
        try {
            const savedClass = await this.classesRepository.save(newClass);
            this.logger.log(`Clase creada con ID: ${savedClass.id}, Código: ${savedClass.classCode}`);
            return savedClass;
        }
        catch (error) {
            this.logger.error(`Error al guardar la nueva clase: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Error al crear la clase.');
        }
    }
    async joinClass(joinClassDto, studentId) {
        const student = await this.usersService.findOneById(studentId);
        if (!student.roles?.includes(user_entity_1.UserRole.Alumno) &&
            !student.roles?.includes(user_entity_1.UserRole.Admin)) {
            throw new common_1.ForbiddenException('Solo los alumnos o administradores pueden unirse a clases de esta manera.');
        }
        // APLICAR .trim() AQUÍ
        const classToJoin = await this.classesRepository.findOne({
            where: { classCode: joinClassDto.classCode.trim() }, // <--- CAMBIO AQUÍ
            relations: ['studentEnrollments', 'teacher'],
        });
        if (!classToJoin) {
            throw new common_1.NotFoundException(`Clase con código "${joinClassDto.classCode.trim()}" no encontrada.`);
        }
        const isAlreadyEnrolled = classToJoin.studentEnrollments.some((enrollment) => enrollment.userId === student.id);
        if (isAlreadyEnrolled) {
            this.logger.log(`El alumno ${student.id} ya está inscrito en la clase ${classToJoin.id}.`);
            return classToJoin;
        }
        const newEnrollment = this.classEnrollmentRepository.create({
            classId: classToJoin.id,
            userId: student.id,
        });
        await this.classEnrollmentRepository.save(newEnrollment);
        this.logger.log(`Alumno ${student.id} inscrito exitosamente en la clase ${classToJoin.id}.`);
        return this.findById(classToJoin.id, student.id);
    }
    async findAllForUser(userId) {
        const user = await this.usersService.findOneById(userId);
        let classes = [];
        if (user.roles?.includes(user_entity_1.UserRole.Profesor) || user.roles?.includes(user_entity_1.UserRole.Admin)) {
            const taughtClasses = await this.classesRepository.find({
                where: { teacherId: user.id },
                relations: ['teacher', 'studentEnrollments', 'studentEnrollments.user'], // Incluir usuarios en enrollments
            });
            classes = classes.concat(taughtClasses);
        }
        if (user.roles?.includes(user_entity_1.UserRole.Alumno) || user.roles?.includes(user_entity_1.UserRole.Admin)) {
            const enrollments = await this.classEnrollmentRepository.find({
                where: { userId: user.id },
                relations: ['class', 'class.teacher', 'class.studentEnrollments', 'class.studentEnrollments.user'], // Incluir usuarios en enrollments
            });
            // Filtrar para evitar duplicados si un usuario es profesor y alumno de la misma clase
            const enrolledClasses = enrollments.map(enrollment => enrollment.class)
                .filter(enrolledClass => !classes.some(c => c.id === enrolledClass.id));
            classes = classes.concat(enrolledClasses);
        }
        // Ordenar para una visualización consistente
        return classes.sort((a, b) => a.name.localeCompare(b.name));
    }
    // MODIFICADO: Agregado un parámetro opcional para cargar relaciones
    async findById(classId, userId, relations = ['teacher', 'studentEnrollments', 'studentEnrollments.user']) {
        this.logger.log(`Buscando clase ID: ${classId} para usuario ID: ${userId} con relaciones: ${relations.join(', ')}`);
        const classEntity = await this.classesRepository.findOne({
            where: { id: classId },
            relations: relations, // Usar las relaciones pasadas o las predeterminadas
        });
        if (!classEntity) {
            throw new common_1.NotFoundException(`Clase con ID ${classId} no encontrada.`);
        }
        // Verificar si el usuario es el profesor o está matriculado
        const isTeacher = classEntity.teacherId === userId;
        const isStudent = classEntity.studentEnrollments.some(enrollment => enrollment.userId === userId);
        const isAdmin = (await this.usersService.findOneById(userId)).roles?.includes(user_entity_1.UserRole.Admin);
        if (!isTeacher && !isStudent && !isAdmin) {
            throw new common_1.ForbiddenException('No tienes permiso para acceder a esta clase.');
        }
        return classEntity;
    }
    async findClassMembers(classId) {
        this.logger.log(`Obteniendo miembros para la clase ID: ${classId}`);
        const classEntity = await this.classesRepository.findOne({
            where: { id: classId },
            relations: ['teacher', 'studentEnrollments', 'studentEnrollments.user'], // Asegura que la relación 'user' se carga
        });
        if (!classEntity) {
            throw new common_1.NotFoundException(`Clase con ID ${classId} no encontrada.`);
        }
        const teachers = classEntity.teacher ? [classEntity.teacher] : [];
        const students = classEntity.studentEnrollments
            .filter(enrollment => enrollment.user) // Filtrar si user es null/undefined
            .map(enrollment => enrollment.user);
        return { teachers, students };
    }
    async importClassesFromExcel(fileBuffer, uploaderId) {
        const uploader = await this.usersService.findOneById(uploaderId);
        if (!uploader.roles?.includes(user_entity_1.UserRole.Admin) && !uploader.roles?.includes(user_entity_1.UserRole.Profesor)) {
            throw new common_1.ForbiddenException('Solo los administradores o profesores pueden importar clases.');
        }
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        if (!data || data.length === 0) {
            throw new common_1.BadRequestException('El archivo Excel está vacío o no tiene el formato esperado.');
        }
        const newClasses = [];
        for (const row of data) {
            const className = row.Clase;
            const classCode = row.Codigo; // Asume que el código viene en el Excel
            if (!className || !classCode) {
                this.logger.warn(`Fila omitida por datos incompletos: ${JSON.stringify(row)}`);
                continue;
            }
            // Buscar si la clase ya existe por nombre o código
            let existingClass = await this.classesRepository.findOne({ where: [{ name: className }, { classCode: classCode }] });
            if (existingClass) {
                this.logger.warn(`Clase "${className}" o código "${classCode}" ya existe. Omitiendo creación.`);
                continue; // O podrías actualizarla
            }
            const newClassPartial = {
                name: className,
                description: row.Description, // FIXED: Corregido el nombre de la propiedad
                classCode: classCode,
                teacherId: uploader.id, // El que sube el archivo es el profesor de estas clases
                teacher: uploader,
            };
            const newClass = this.classesRepository.create(newClassPartial);
            newClasses.push(newClass);
        }
        if (newClasses.length === 0) {
            return { message: 'No se crearon nuevas clases (ya existían o los datos eran incompletos).' };
        }
        try {
            await this.classesRepository.save(newClasses);
            return { message: `Se importaron ${newClasses.length} clases exitosamente.` };
        }
        catch (error) {
            this.logger.error(`Error al guardar clases importadas: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Error al importar clases.');
        }
    }
    // FIXED: Nuevo método para verificar si un usuario está matriculado en una clase
    async isUserEnrolledInClass(classId, userId) {
        const enrollment = await this.classEnrollmentRepository.findOne({
            where: { classId, userId },
        });
        return !!enrollment;
    }
};
exports.ClassesService = ClassesService;
exports.ClassesService = ClassesService = ClassesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(class_entity_1.Class)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => users_service_1.UsersService))),
    __param(3, (0, typeorm_1.InjectRepository)(class_enrollment_entity_1.ClassEnrollment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService,
        sendgrid_service_1.SendGridService,
        typeorm_2.Repository])
], ClassesService);
//# sourceMappingURL=classes.service.js.map