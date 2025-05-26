export class ExcelClassRowDto {
    Clase: string;     
    Codigo: string;     
    Profesor: string;   
    Alumnos?: string;   
    Description?: string; 
}

export class ImportClassesDto {
    file: Express.Multer.File;
}