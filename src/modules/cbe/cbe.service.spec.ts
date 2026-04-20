import { Test, TestingModule } from '@nestjs/testing';
import { CbeService } from './cbe.service';

describe('CbeService', () => {
  let service: CbeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CbeService],
    }).compile();

    service = module.get<CbeService>(CbeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
