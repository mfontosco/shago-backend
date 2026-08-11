import { Test, TestingModule } from '@nestjs/testing';
import { VariantattributeController } from './variantattribute.controller';

describe('VariantattributeController', () => {
  let controller: VariantattributeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VariantattributeController],
    }).compile();

    controller = module.get<VariantattributeController>(VariantattributeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
