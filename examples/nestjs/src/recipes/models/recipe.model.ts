import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';
import { Ingredients, IngredientsSummary } from '../../ingredients/models/ingredient.model';
import { ArrayAggregations, CollectionField, IdField, Relation, StringAggregations, StringField, Table } from 'gql2sql-nestjs';

@Table()
export class Recipe {
  @IdField({})
  id?: string;

  @StringField({})
  title?: string;

  @StringField({ nullable: true })
  description?: string | null;

  @Field()
  // @ts-expect-error
  creationDate: Date;

  @Relation('id', 'RecipeToIngredient', 'recipeId', 'ingredientId', 'Ingredient', 'id')
  @CollectionField()
  // @ts-expect-error
  ingredients: Ingredients;
}

@ObjectType()
class NestedIngredientsSummary {
  @Field(() => IngredientsSummary)
  sum?: IngredientsSummary;
  @Field(() => IngredientsSummary)
  avg?: IngredientsSummary;
  @Field(() => IngredientsSummary)
  count?: IngredientsSummary;
  @Field(() => IngredientsSummary)
  std?: IngredientsSummary;
  @Field(() => IngredientsSummary)
  max?: IngredientsSummary;
  @Field(() => IngredientsSummary)
  min?: IngredientsSummary;
}

@ObjectType({ description: 'summary' })
export class RecipesSummary {
  // this needs to be implemented!! in gql2sql
  @Field(() => ArrayAggregations)
  total?: ArrayAggregations;

  @Field(() => StringAggregations)
  title?: StringAggregations;

  @Field(() => NestedIngredientsSummary)
  ingredients?: NestedIngredientsSummary;
}

@ObjectType()
export class Recipes {
  @Field(type => RecipesSummary, { defaultValue: {} })
  // @ts-expect-error
  summary: RecipesSummary;

  @Field(() => [Recipe], { defaultValue: [] })
  // @ts-expect-error
  details: Recipe[];
}
