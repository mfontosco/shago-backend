import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributesController } from './attributes.controller';
import { AttributesService } from './attributes.service';
import { Attributes } from './entities/attributes.entities';

@Module({
  imports: [TypeOrmModule.forFeature([Attributes])],
  controllers: [AttributesController],
  providers: [AttributesService]
})
export class AttributesModule {}
