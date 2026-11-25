import { PartialType } from '@nestjs/mapped-types';
import { CreateRecipeDto } from './create-recipe.dto';

/**
 * Dữ liệu sửa công thức (UC-19). PartialType giữ nguyên mọi ràng buộc của
 * CreateRecipeDto nhưng cho phép vắng mặt, nên client gửi được từng phần.
 *
 * Hai ràng buộc @ArrayMinSize(1) vẫn còn hiệu lực khi field được gửi: gửi
 * ingredients hoặc steps thì phải có ít nhất 1 phần tử (UC-19 ngoại lệ 4b).
 * Bỏ hẳn field khỏi body mới là "không sửa phần đó".
 */
export class UpdateRecipeDto extends PartialType(CreateRecipeDto) {}
