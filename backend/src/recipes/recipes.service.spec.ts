import { NotImplementedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RecipeSource } from '../generated/prisma/enums';
import { LocalDbProvider } from './local-db.provider';
import { RecipesService } from './recipes.service';
import type { RecipeDetail } from './recipe-provider.interface';

const detail = { id: '1', title: 'Phở bò' } as RecipeDetail;

const localDbProviderMock = {
  getById: jest.fn(),
};

describe('RecipesService', () => {
  let service: RecipesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        RecipesService,
        { provide: LocalDbProvider, useValue: localDbProviderMock },
      ],
    }).compile();
    service = moduleRef.get(RecipesService);
  });

  it('source LOCAL thì gọi LocalDbProvider và trả thẳng kết quả', async () => {
    localDbProviderMock.getById.mockResolvedValue(detail);

    await expect(service.getById('1', RecipeSource.LOCAL)).resolves.toBe(
      detail,
    );
    expect(localDbProviderMock.getById).toHaveBeenCalledTimes(1);
    expect(localDbProviderMock.getById).toHaveBeenCalledWith('1');
  });

  it('source SPOONACULAR thì 501 và không chạm LocalDbProvider', async () => {
    await expect(
      service.getById('716429', RecipeSource.SPOONACULAR),
    ).rejects.toThrow(new NotImplementedException('Chưa hỗ trợ nguồn Spoonacular'));
    expect(localDbProviderMock.getById).not.toHaveBeenCalled();
  });
});
