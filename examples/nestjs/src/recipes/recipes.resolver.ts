import { NotFoundException } from '@nestjs/common';
import { Args, Context, Field, ID, Info, Mutation, Parent, Query, ResolveField, Resolver, Subscription } from '@nestjs/graphql';
import { NewRecipeInput } from './dto/new-recipe.input';
import { RecipesArgs } from './dto/recipes.args';
import { Recipe, Recipes } from './models/recipe.model';
import { RecipesService } from './recipes.service';
import { GraphQLResolveInfo } from 'graphql';
import { IDArgs } from 'gql2sql-nestjs';


function Filters<T>(f: new () => T) {
  const x = Object.getOwnPropertyNames(new f());

  console.log(new f());
  console.log(x);

  return class { };
}

@Resolver(() => Recipe)
export class RecipesResolver extends Filters(Recipe) {
  constructor(private readonly recipesService: RecipesService) { super(); }

  @Query(returns => Recipe)
  async recipe(@Args('id') id: string) {
    const recipe = await this.recipesService.findOneById(id);
    if (!recipe) {
      throw new NotFoundException(id);
    }
    return recipe;
  }

  @Query(returns => Recipes)
  recipes(@Args() recipesArgs: RecipesArgs, @Info() info: GraphQLResolveInfo) {
    return this.recipesService.select(info);
  }

  @Mutation(returns => ID)
  async addRecipe(
    @Args('newRecipeData') newRecipeData: NewRecipeInput,
  ) {
    const recipe = await this.recipesService.create(newRecipeData);
    return recipe;
  }

  @Mutation(returns => Boolean)
  async removeRecipe(@Args('id') id: string) {
    return this.recipesService.remove(id);
  }

  @ResolveField()
  async id(@Args() args: IDArgs, @Parent() recipe: Recipe) {
    return recipe.id;
  }
}

