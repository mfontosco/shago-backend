import { Test, TestingModule } from '@nestjs/testing';
import { CatgeoriesController } from './categories.controller';

describe('CatgeoriesController', () => {
  let controller: CatgeoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatgeoriesController],
    }).compile();

    controller = module.get<CatgeoriesController>(CatgeoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
