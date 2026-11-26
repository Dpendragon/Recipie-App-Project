import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  ListReviewsQueryDto,
  ReviewSourceQueryDto,
} from './dto/review-query.dto';
import { ReviewsService } from './reviews.service';

// req.user do JwtStrategy.validate() gán (users trừ passwordHash).
type AuthUser = { id: number };

// Controller không đặt prefix vì phải phục vụ hai gốc đường dẫn khác nhau:
// /recipes/:id/reviews và /reviews/mine.
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Route tĩnh khai TRƯỚC mọi route động để không bị ':id' bắt nhầm 'mine'.
  // GET /reviews/mine?cursor=&limit= — đánh giá của mình
  @Get('reviews/mine')
  listMine(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.reviewsService.listMine(user.id, query);
  }

  // POST /recipes/:id/reviews?source= — tạo mới hoặc sửa
  @Post('recipes/:id/reviews')
  @HttpCode(HttpStatus.OK)
  upsert(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query() query: ReviewSourceQueryDto,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.upsert(user.id, id, query.source, dto);
  }

  // GET /recipes/:id/reviews?source=&cursor=&limit= — đánh giá của một công thức
  @Get('recipes/:id/reviews')
  listByRecipe(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query() query: ListReviewsQueryDto,
  ) {
    return this.reviewsService.listByRecipe(user.id, id, query.source, query);
  }

  // DELETE /recipes/:id/reviews?source= — xoá đánh giá của mình
  @Delete('recipes/:id/reviews')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query() query: ReviewSourceQueryDto,
  ) {
    return this.reviewsService.remove(user.id, id, query.source);
  }
}
