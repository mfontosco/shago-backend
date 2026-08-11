import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VariantattributeService } from './variantattribute.service';
import { VariantattributeController } from './variantattribute.controller';
import { VariantAttribute } from './entities/variant-attribute.entities';

@Module({
  imports: [TypeOrmModule.forFeature([VariantAttribute])],
  providers: [VariantattributeService],
  controllers: [VariantattributeController]
})
export class VariantattributeModule {}
