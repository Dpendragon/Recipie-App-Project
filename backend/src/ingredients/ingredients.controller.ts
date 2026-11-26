import { Controller, Get, Query } from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
import { IngredientAutocompleteQueryDto } from './dto/ingredient-autocomplete-query.dto';

@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Get('autocomplete')
  autocomplete(@Query() query: IngredientAutocompleteQueryDto) {
    return this.ingredientsService.autocomplete(query.q, query.limit);
  }
}
