import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attributes } from './entities/attributes.entities';
import { CreateAttributeDto } from './dtos/create-attribute.dto';

@Injectable()
export class AttributesService {

    constructor(
        @InjectRepository(Attributes)
        private readonly attributeRepository: Repository<Attributes>){}


        async  createAttribute(dto: CreateAttributeDto): Promise<Attributes>{
            const attributeExist = await this.attributeRepository.findOne({
                where: {
                    name: dto.name
                }
            })

            if(attributeExist)throw new ConflictException("Attribute with the name already exists")

                const newAttribute = this.attributeRepository.create({
                name: dto.name,
                slug: dto.slug,
                sort_order: dto.sort_order,
                });

                return this.attributeRepository.save(newAttribute)
        }

        async getAttributes():Promise<Attributes[]>{
            const attributes = await this.attributeRepository.find({
                relations:["values"]
            })

            if(attributes.length === 0) throw new NotFoundException("Attributes are not found")
                
            return attributes
        }
}
