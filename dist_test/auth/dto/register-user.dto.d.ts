export declare enum UserRole {
    Alumno = "Alumno",
    Profesor = "Profesor",
    Padre = "Padre",
    Admin = "admin"
}
export declare class RegisterUserDto {
    firstName: string;
    lastName?: string;
    email: string;
    password: string;
    roles: UserRole[];
}
