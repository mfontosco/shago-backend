import { Test, TestingModule } from '@nestjs/testing';
import { VariantattributeService } from './variantattribute.service';

describe('VariantattributeService', () => {
  let service: VariantattributeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VariantattributeService],
    }).compile();

    service = module.get<VariantattributeService>(VariantattributeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
