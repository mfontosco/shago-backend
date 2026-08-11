import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductvariantService } from './productvariant.service';
import { ProductvariantController } from './productvariant.controller';
import { ProductVariant } from './entities/product-variant.entities';

@Module({
  imports: [TypeOrmModule.forFeature([ProductVariant])],
  providers: [ProductvariantService],
  controllers: [ProductvariantController]
})
export class ProductvariantModule {}
