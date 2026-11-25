import { Controller, Get, Query } from '@nestjs/common';
import { AutocompleteIngredientDto } from './dto/autocomplete-ingredient.dto';
import { IngredientsService } from './ingredients.service';

@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  // GET /ingredients/autocomplete?q=ca&limit=10
  @Get('autocomplete')
  autocomplete(@Query() query: AutocompleteIngredientDto) {
    return this.ingredientsService.autocomplete(query.q, query.limit);
  }
}
