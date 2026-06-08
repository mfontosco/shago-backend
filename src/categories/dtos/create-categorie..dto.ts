import { IsEmpty, IsOptional, IsString } from "class-validator"



export class createCategoryDto{
    @IsEmpty()
    @IsString()
    name: string

    @IsString()
    @IsOptional()
    slug: string

    @IsString()
    @IsOptional()
    description: string
}