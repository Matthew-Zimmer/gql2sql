import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';
import { Ingredients } from '../../ingredients/models/ingredient.model';
import { CollectionField, Relation, Table } from '../../nestjs';

@Table()
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

  @Relation('id', 'RecipeToIngredient', 'recipeId', 'ingredientId', 'Ingredient', 'id')
  @CollectionField()
  // @ts-expect-error
  ingredients: Ingredients;
}

@ObjectType({ description: 'summary' })
export class RecipesSummary {
  @Field(() => String)
  dummy?: string;
}

@ObjectType()
export class Recipes {
  @Field(type => RecipesSummary, { defaultValue: {} })
  // @ts-expect-error
  id: string;

  @Field(() => [Recipe], { defaultValue: [] })
  // @ts-expect-error
  details: Recipe[];
}
