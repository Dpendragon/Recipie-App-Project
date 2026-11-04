import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateMealPlanDto } from './dto/create-meal-plan.dto';
import { MealPlanQueryDto } from './dto/meal-plan-query.dto';
import { UpdateMealPlanDto } from './dto/update-meal-plan.dto';
import { MealPlanService } from './meal-plan.service';

// Kiểu tối thiểu của req.user (do JwtStrategy.validate() trả về).
type AuthUser = { id: number };

// Tất cả route ở đây đều cần JWT (JwtAuthGuard là guard toàn cục).
@Controller('meal-plan')
export class MealPlanController {
  constructor(private readonly mealPlanService: MealPlanService) {}

  // GET /meal-plan?from=YYYY-MM-DD&to=YYYY-MM-DD (UC-22)
  @Get()
  findRange(@CurrentUser() user: AuthUser, @Query() query: MealPlanQueryDto) {
    return this.mealPlanService.findRange(user.id, query.from, query.to);
  }

  // POST /meal-plan (UC-21)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMealPlanDto) {
    return this.mealPlanService.create(user.id, dto);
  }

  // PATCH /meal-plan/:id — đổi món (UC-23)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMealPlanDto,
  ) {
    return this.mealPlanService.update(user.id, id, dto);
  }

  // DELETE /meal-plan/:id (UC-24) — 204 khi xoá thành công
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.mealPlanService.remove(user.id, id);
  }
}
