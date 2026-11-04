import { Matches } from 'class-validator';
import { DATE_ONLY_REGEX } from '../meal-plan.utils';

// Query ?from=YYYY-MM-DD&to=YYYY-MM-DD (cả 2 đầu đều tính).
export class MealPlanQueryDto {
  @Matches(DATE_ONLY_REGEX, { message: 'from phải có dạng YYYY-MM-DD' })
  from!: string;

  @Matches(DATE_ONLY_REGEX, { message: 'to phải có dạng YYYY-MM-DD' })
  to!: string;
}
