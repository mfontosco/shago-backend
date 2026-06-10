import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AttributeValue } from './entities/attribute_value.entities';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { Attributes } from 'src/attributes/entities/attributes.entities';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AttributeValueService {
    constructor(
        @InjectRepository(AttributeValue)
        private readonly attributeValueRepository : Repository<AttributeValue>,
        @InjectRepository(Attributes)
        private readonly attributeRepository: Repository<Attributes>
    ){}

    async createAttributeValue(attributeId:string, dto:CreateAttributeValueDto){
         const attributeExist = await this.attributeRepository.findOne({
            where:{
                id:attributeId
            }
         })
         if(!attributeExist){
            throw new NotFoundException("attribute with this id doesn't exist")
         }
         const attributeValueExist = await this.attributeValueRepository.findOne({
            where:{
                value: dto.value,
                attribute:{
                    id:attributeId
                }
            }
         })

         if(attributeValueExist){
            throw new ConflictException("This attribute value already exist for this attribute")
         }

         const newAttributeValue = await this.attributeValueRepository.create({
            ...dto, attribute:attributeExist
         })

         return this.attributeValueRepository.save(newAttributeValue)
    }

    async getAttributeValue(){
        const attributeValues = await this.attributeValueRepository.find()

        return attributeValues
    }

    
}
