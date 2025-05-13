// proyecto/school-sync-backend/src/classes/dto/import-classes.dto.ts
export class ExcelClassRowDto {
    Clase: string;      // Columna A
    Codigo: string;     // Columna B
    Profesor: string;    // Columna C (email del maestro)
    Alumnos?: string;   // Columna D (emails de alumnos separados por coma)
    Description?: string; // Opcional
}

// No es estrictamente un DTO para validación de body, pero útil para tipado
export class ImportClassesDto {
    file: Express.Multer.File; // Se usará con @UploadedFile
}