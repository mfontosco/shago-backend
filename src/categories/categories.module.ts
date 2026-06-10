import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CatgeoriesService } from './categories.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Categeories } from './entities/categories.entities';

@Module({
  imports:[TypeOrmModule.forFeature([Categeories])],
  controllers: [CategoriesController],
  providers: [CatgeoriesService],
  exports:[CatgeoriesService]
})
export class CatgeoriesModule {}
