import { IsNotEmpty, IsString } from 'class-validator';

export class LinkStudentDto {
  @IsNotEmpty()
  @IsString()
  studentAuth0Id: string; 
}