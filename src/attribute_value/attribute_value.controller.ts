import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AttributeValueService } from './attribute_value.service';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';

@Controller('attribute-value')
export class AttributeValueController {

    constructor(private readonly attributeValueService: AttributeValueService){}

    @Post(":id/value")
    async createAttributeValue(@Param()attributeId:string,@Body()dto:CreateAttributeValueDto){
        return  this.attributeValueService.createAttributeValue(attributeId,dto)
    }

    @Get("")
    async getAttributeValue(){
        return this.attributeValueService.getAttributeValue()
    }
}
