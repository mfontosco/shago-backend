import { Module } from '@nestjs/common';
import { AttributeValueController } from './attribute_value.controller';
import { AttributeValueService } from './attribute_value.service';

@Module({
  controllers: [AttributeValueController],
  providers: [AttributeValueService]
})
export class AttributeValueModule {}
