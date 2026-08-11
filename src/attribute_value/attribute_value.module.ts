import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeValueController } from './attribute_value.controller';
import { AttributeValueService } from './attribute_value.service';
import { AttributeValue } from './entities/attribute_value.entities';
import { Attributes } from '../attributes/entities/attributes.entities';

@Module({
  imports: [TypeOrmModule.forFeature([AttributeValue, Attributes])],
  controllers: [AttributeValueController],
  providers: [AttributeValueService]
})
export class AttributeValueModule {}
