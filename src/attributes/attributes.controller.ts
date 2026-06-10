import { Body, Controller, Get, Post } from '@nestjs/common';
import { AttributesService } from './attributes.service';
import { CreateAttributeDto } from './dtos/create-attribute.dto';
import { Attributes } from './entities/attributes.entities';

@Controller('attributes')
export class AttributesController {
constructor(private readonly attributeService: AttributesService){}

@Post("")
async createAttribute(@Body()dto: CreateAttributeDto ): Promise<Attributes>{
    const  newAttribute = await this.attributeService.createAttribute(dto)

    return newAttribute
}

@Get("")
async getAttributes():Promise<Attributes[]>{
    const attributes = await this.attributeService.getAttributes()

    return attributes
}
}
