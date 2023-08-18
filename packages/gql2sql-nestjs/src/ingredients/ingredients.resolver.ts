import { NotFoundException } from '@nestjs/common';
import { Args, ID, Info, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { Ingredient, Ingredients } from './models/ingredient.model';
import { IngredientsService } from './ingredients.service';
import { GraphQLResolveInfo } from 'graphql';
import { NewIngredientInput } from './dto/new-ingredient.input';

@Resolver(() => Ingredient)
export class IngredientsResolver {
  constructor(private readonly ingredientsService: IngredientsService) { }

  @Query(returns => Ingredient)
  async ingredient(@Args('id') id: string) {
    const recipe = await this.ingredientsService.findOneById(id);
    if (!recipe) {
      throw new NotFoundException(id);
    }
    return recipe;
  }

  @Query(returns => Ingredients)
  ingredients(@Info() info: GraphQLResolveInfo) {
    return this.ingredientsService.select(info);
  }

  @Mutation(returns => ID)
  async addIngredient(
    @Args('newIngredient') newIngredient: NewIngredientInput,
  ) {
    const id = await this.ingredientsService.create(newIngredient);
    return id;
  }
}
