import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { Ingredient } from '../models/ingredient.model';
import { IngredientKind } from '@prisma/client';

@InputType()
export class NewIngredientInput {
  @Field(() => String)
  // @ts-expect-error
  name: string;

  @Field(() => Int)
  // @ts-expect-error
  amount: number;

  @Field(() => IngredientKind)
  // @ts-expect-error
  kind: IngredientKind;
}
