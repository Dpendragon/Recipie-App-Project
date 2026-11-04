import { IsIn, Matches } from 'class-validator';
import {
  DATE_ONLY_REGEX,
  MEAL_SLOT_VALUES,
  type MealSlotValue,
} from '../meal-plan.utils';
import { UpdateMealPlanDto } from './update-meal-plan.dto';

// THÊM MÓN (UC-21) = thông tin công thức (giống đổi món) + ngày + buổi ăn.
export class CreateMealPlanDto extends UpdateMealPlanDto {
  // Kiểm tra ngày có thật (vd 2026-02-30) được làm ở service.
  @Matches(DATE_ONLY_REGEX, { message: 'Ngày phải có dạng YYYY-MM-DD' })
  date!: string;

  @IsIn(MEAL_SLOT_VALUES, {
    message: 'Buổi ăn phải là breakfast, lunch hoặc dinner',
  })
  mealSlot!: MealSlotValue;
}
