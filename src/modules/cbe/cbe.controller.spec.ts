import { Test, TestingModule } from '@nestjs/testing';
import { CbeController } from './cbe.controller';

describe('CbeController', () => {
  let controller: CbeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CbeController],
    }).compile();

    controller = module.get<CbeController>(CbeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
