import { Test, TestingModule } from '@nestjs/testing';
import { CatgeoriesService } from './categories.service';

describe('CatgeoriesService', () => {
  let service: CatgeoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CatgeoriesService],
    }).compile();

    service = module.get<CatgeoriesService>(CatgeoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
