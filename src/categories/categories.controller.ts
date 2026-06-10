import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CatgeoriesService } from './categories.service';
import { createCategoryDto } from './dtos/create-categorie..dto';
import { Categeories } from './entities/categories.entities';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoryService: CatgeoriesService){}

    @Post("")
    async createCategories(@Body()dto:createCategoryDto):Promise<Categeories>{
        const categories = await this.categoryService.createCategory(dto)

        return categories
    }
    @Get("")
    async getCategories():Promise<Categeories[]>{
        return this.categoryService.getCategories()
    }
}
