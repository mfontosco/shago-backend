import { IsEmpty, IsString } from "class-validator"



export class CreateAttributeDto{

    @IsString()
    @IsEmpty()
    name:string


    @IsString()
    slug: string

    @IsString()
    sort_order:string


}