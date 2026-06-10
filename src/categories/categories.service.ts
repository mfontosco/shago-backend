import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Categeories } from './entities/categories.entities';
import { createCategoryDto } from './dtos/create-categorie..dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CatgeoriesService {

    constructor(
        @InjectRepository(Categeories)
        private readonly categoryRepository:Repository<Categeories>
    ){}


    async createCategory(dto: createCategoryDto):Promise<Categeories>{
        
        const categoryExist = await this.categoryRepository.findOne({where:{name:dto.name}})
        if(categoryExist){
            throw new NotFoundException("This category already exists")
    
        }
        const newCategory = await this.categoryRepository.create(dto)

        return this.categoryRepository.save(newCategory)

    }

    async getCategories():Promise<Categeories[]>{
        const catgeories = await this.categoryRepository.find()
        return catgeories
    }
}
