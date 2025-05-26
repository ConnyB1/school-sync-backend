import { IsNotEmpty, IsString, Length } from 'class-validator';

export class JoinClassDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 20) 
  classCode: string; 
}