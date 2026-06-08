import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CatgeoriesService } from './categories.service';

@Module({
  controllers: [CategoriesController],
  providers: [CatgeoriesService]
})
export class CatgeoriesModule {}
