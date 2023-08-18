import { Directive, Extensions, Field, ID, ObjectType } from '@nestjs/graphql';
import { collectionExtensionName, relationExtensionName, tableExtensionName } from 'gql2sql'
import { Ingredients } from '../../ingredients/models/ingredient.model';

@ObjectType({ description: 'recipe' })
@Extensions({ [tableExtensionName]: { name: 'Recipe' } })
export class Recipe {
  @Field(type => ID)
  // @ts-expect-error
  id: string;

  @Directive('@upper')
  // @ts-expect-error
  title: string;

  @Field(() => String, { nullable: true })
  // @ts-expect-error
  description: string | null;

  @Field()
  // @ts-expect-error
  creationDate: Date;

  @Field(type => Ingredients, {
    // @ts-ignore
    middleware: async (ctx, next) => {
      const value = await next();
      return value ?? {};
    }
  })
  @Extensions({ [relationExtensionName]: [{ parentId: "id", to: "RecipeToIngredient", childId: "recipeId" }, { parentId: "ingredientId", to: "Ingredient", childId: "id" }] })
  @Extensions({ [collectionExtensionName]: {} })
  // @ts-expect-error
  ingredients: Ingredients;
}

@ObjectType({ description: 'summary' })
export class RecipesSummary {
  @Field(() => String)
  dummy?: string;
}

@ObjectType({ description: 'recipes' })

export class Recipes {
  @Field(type => RecipesSummary, { defaultValue: {} })
  // @ts-expect-error
  id: string;

  @Field(() => [Recipe], { defaultValue: [] })
  // @ts-expect-error
  details: Recipe[];
}
