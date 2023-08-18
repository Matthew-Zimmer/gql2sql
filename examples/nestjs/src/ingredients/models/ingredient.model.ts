import { Field, Float, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { IngredientKind } from '@prisma/client';
import { Variant, VariantOf } from '../../nestjs';

registerEnumType(IngredientKind, {
  name: 'IngredientKind',
});

@Variant()
export abstract class Ingredient {
  @Field(type => ID)
  // @ts-expect-error
  id: string;

  @Field(() => String)
  // @ts-expect-error
  name: string;

  @Field(() => IngredientKind)
  // @ts-expect-error
  kind: IngredientKind;
}

@VariantOf(() => Ingredient)
export class SolidIngredient {
  @Field(type => ID)
  // @ts-expect-error
  id: string;

  @Field(() => Int)
  // @ts-expect-error
  quantity: number;
}

@VariantOf(() => Ingredient)
export class LiquidIngredient {
  @Field(type => ID)
  // @ts-expect-error
  id: string;

  @Field(() => Float)
  // @ts-expect-error
  amount: number;
}


@ObjectType({ description: 'summary' })
export class IngredientsSummary {
  @Field(() => String)
  dummy?: string;
}

@ObjectType()
export class Ingredients {
  @Field(type => IngredientsSummary, { defaultValue: {} })
  // @ts-expect-error
  id: string;

  @Field(() => [Ingredient], { defaultValue: [] })
  // @ts-expect-error
  details: Ingredient[];
}
