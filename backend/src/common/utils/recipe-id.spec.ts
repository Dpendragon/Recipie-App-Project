import { RecipeSource } from '../../generated/prisma/enums';
import { isLocalId, normalizeRecipeId } from './recipe-id';

describe('recipe-id', () => {
  describe('isLocalId', () => {
    it.each(['1', '007', '716429'])('%s là id nội bộ hợp lệ', (id) => {
      expect(isLocalId(id)).toBe(true);
    });

    it.each(['abc', '7a', '', '-1', '1.5'])(
      '%s không phải id nội bộ',
      (id) => {
        expect(isLocalId(id)).toBe(false);
      },
    );
  });

  describe('normalizeRecipeId', () => {
    it('LOCAL thì bỏ số 0 ở đầu để "7" và "007" về cùng một dòng', () => {
      expect(normalizeRecipeId('007', RecipeSource.LOCAL)).toBe('7');
      expect(normalizeRecipeId('7', RecipeSource.LOCAL)).toBe('7');
    });

    it('LOCAL với id sai định dạng thì giữ nguyên (để tầng trên trả 404)', () => {
      expect(normalizeRecipeId('abc', RecipeSource.LOCAL)).toBe('abc');
    });

    it('SPOONACULAR thì giữ nguyên id của nguồn ngoài', () => {
      expect(normalizeRecipeId('007', RecipeSource.SPOONACULAR)).toBe('007');
    });
  });
});
