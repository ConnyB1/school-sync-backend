export declare class ExcelClassRowDto {
    Clase: string;
    Codigo: string;
    Profesor: string;
    Alumnos?: string;
    Description?: string;
}
export declare class ImportClassesDto {
    file: Express.Multer.File;
}
