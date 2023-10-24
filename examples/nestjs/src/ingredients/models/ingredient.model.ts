import { ArgsType, Field, Float, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { IngredientKind } from '@prisma/client';
import { ArgsField, ArrayAggregations, BooleanArgs, FloatField, IdField, StringAggregations, StringField, Variant, VariantOf } from 'gql2sql-nestjs';
import { Ordering } from 'gql2sql-nestjs/dist/graphql/args/ordering';

registerEnumType(IngredientKind, {
  name: 'IngredientKind',
});

@ArgsType()
export class IngredientKindArgs {
  @Field(() => IngredientKind, { nullable: true })
  eq?: IngredientKind;

  @Field(() => IngredientKind, { nullable: true })
  neq?: IngredientKind;

  @Field(() => [IngredientKind], { nullable: true })
  in?: IngredientKind;

  @Field(() => [IngredientKind], { nullable: true })
  notIn?: IngredientKind;

  @Field(() => Boolean, { nullable: true })
  opt?: boolean;
}

@Variant()
export abstract class Ingredient {
  @IdField({})
  id?: string;

  @StringField({})
  name?: string;

  // TODO think about how to filter enums
  @ArgsField(() => IngredientKind, { args: () => IngredientKindArgs })
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


@ArgsType()
export class OrderingArgs {
  @Field(() => Ordering, { nullable: true })
  sort?: Ordering;
}

@ObjectType({ description: 'summary' })
export class IngredientsSummary {
  @Field(() => ArrayAggregations)
  total?: ArrayAggregations;

  @ArgsField(() => StringAggregations, { args: () => OrderingArgs })
  name?: StringAggregations;
}

@ObjectType()
export class Ingredients {
  @Field(type => IngredientsSummary, { defaultValue: {} })
  summary?: string;

  @Field(() => [Ingredient], { defaultValue: [] })
  details?: Ingredient[];
}
