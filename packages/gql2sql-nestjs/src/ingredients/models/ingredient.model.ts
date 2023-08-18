import { Directive, Extensions, Field, Float, ID, Int, InterfaceType, ObjectType, registerEnumType } from '@nestjs/graphql';
import { IngredientKind } from '@prisma/client';
import { collectionExtensionName, interfaceExtensionName, relationExtensionName, tableExtensionName, variantExtensionName } from 'gql2sql'

registerEnumType(IngredientKind, {
  name: 'IngredientKind',
});

@Extensions({ [tableExtensionName]: { name: 'Ingredient' }, [interfaceExtensionName]: { tagColumn: 'kind' } })
@InterfaceType({ description: "asdjlksadkjd" })
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

@ObjectType({ description: 'SolidIngredient', implements: () => [Ingredient], })
@Extensions({ [tableExtensionName]: { name: 'SolidIngredient' }, [variantExtensionName]: { tag: { column: 'kind', value: 'SolidIngredient' } }, [relationExtensionName]: [{ parentId: 'id', to: 'Ingredient', childId: 'id' }] })
export class SolidIngredient {
  @Field(type => ID)
  // @ts-expect-error
  id: string;

  @Field(() => Int)
  // @ts-expect-error
  quantity: number;
}

@ObjectType({ description: 'LiquidIngredient', implements: () => [Ingredient] })
@Extensions({ [tableExtensionName]: { name: 'LiquidIngredient' }, [variantExtensionName]: { tag: { column: 'kind', value: 'LiquidIngredient' } }, [relationExtensionName]: [{ parentId: 'id', to: 'Ingredient', childId: 'id' }] })
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

@ObjectType({ description: 'Ingredients' })
@Extensions({ [collectionExtensionName]: {} })
export class Ingredients {
  @Field(type => IngredientsSummary, { defaultValue: {} })
  // @ts-expect-error
  id: string;

  @Field(() => [Ingredient], { defaultValue: [] })
  // @ts-expect-error
  details: Ingredient[];
}
