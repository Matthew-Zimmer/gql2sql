import { Field, Float, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { IngredientKind } from '@prisma/client';
import { ArgsField, ArrayAggregations, BooleanArgs, FloatField, IdField, StringAggregations, StringField, Variant, VariantOf } from 'gql2sql-nestjs';

registerEnumType(IngredientKind, {
  name: 'IngredientKind',
});

@Variant()
export abstract class Ingredient {
  @IdField({})
  id?: string;

  @StringField({})
  name?: string;

  // TODO think about how to filter enums
  @ArgsField(() => IngredientKind, { args: () => BooleanArgs })
  kind?: IngredientKind;
}

@VariantOf(() => Ingredient)
export class SolidIngredient {
  @FloatField({})
  quantity?: number;
}

@VariantOf(() => Ingredient)
export class LiquidIngredient {
  @FloatField({})
  amount?: number;
}


@ObjectType({ description: 'summary' })
export class IngredientsSummary {
  @Field(() => ArrayAggregations)
  total?: ArrayAggregations;

  @Field(() => StringAggregations)
  name?: StringAggregations;
}

@ObjectType()
export class Ingredients {
  @Field(type => IngredientsSummary, { defaultValue: {} })
  summary?: string;

  @Field(() => [Ingredient], { defaultValue: [] })
  details?: Ingredient[];
}
