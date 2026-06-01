import { IsEmail, IsEmpty, IsString, MinLength } from "class-validator";


export class RegisterDto{

    @IsEmail()
    email: string

    @IsString()
    @MinLength(6)
    password: string

    @IsString()
    @IsEmpty()
    fullName: string

    @IsEmpty()
    active: boolean
}