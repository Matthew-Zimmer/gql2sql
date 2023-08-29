import { ArgsType, Directive, Extensions, Field, Float, ID, IntersectionType, ObjectType, ReturnTypeFuncValue, TypeMetadataStorage, registerEnumType } from '@nestjs/graphql';
import { Ingredients, IngredientsSummary } from '../../ingredients/models/ingredient.model';
import { ArgsField, ArrayAggregations, CollectionField, FloatAggregations, IDAggregations, IdField, IntAggregations, Relation, StringAggregations, StringField, Table } from 'gql2sql-nestjs';
import { RecipeDifficulty } from '@prisma/client';

registerEnumType(RecipeDifficulty, {
  name: "RecipeDifficulty"
});

@ArgsType()
export class RecipeDifficultyArgs {
  @Field(() => RecipeDifficulty, { nullable: true })
  eq?: RecipeDifficulty;

  @Field(() => RecipeDifficulty, { nullable: true })
  neq?: RecipeDifficulty;

  @Field(() => [RecipeDifficulty], { nullable: true })
  in?: RecipeDifficulty;

  @Field(() => [RecipeDifficulty], { nullable: true })
  notIn?: RecipeDifficulty;
}

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

  @ArgsField(() => RecipeDifficulty, { args: () => RecipeDifficultyArgs })
  difficulty?: RecipeDifficulty;

  @Relation('id', 'RecipeToIngredient', 'recipeId', 'ingredientId', 'Ingredient', 'id')
  @CollectionField()
  // @ts-expect-error
  ingredients: Ingredients;
}



@Table("Ingredient")
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



@ObjectType()
export class RecipesSummaryBase {
  // this needs to be implemented!! in gql2sql
  @Field(() => ArrayAggregations)
  total?: ArrayAggregations;

  @Field(() => StringAggregations)
  title?: StringAggregations;

  @Relation("id", "RecipeToIngredient", "recipeId", "ingredientId", "Ingredient", "id")
  @CollectionField(() => NestedIngredientsSummary)
  ingredients?: NestedIngredientsSummary;

  //@Extensions({ enumeration: {} })
  //@Field(() => NestedIngredientsSummary)
  //difficulty?: NestedIngredientsSummary;
}

@ObjectType()
class RecipesSummaryByDifficulty {
  @Field(() => RecipesSummaryBase)
  easy?: RecipesSummaryBase;

  @Field(() => RecipesSummaryBase)
  medium?: RecipesSummaryBase;

  @Field(() => RecipesSummaryBase)
  hard?: RecipesSummaryBase;
}

@ObjectType({ description: 'summary' })
export class RecipesSummary extends RecipesSummaryBase {
  @Extensions({ enumeration: {} })
  @Field(() => RecipesSummaryByDifficulty)
  difficulty?: RecipesSummaryByDifficulty;
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


function objectFields<T>(target: T) {
  // @ts-expect-error
  return TypeMetadataStorage.metadataByTargetCollection.get(target).fields.getAll().map(x => x.name);
}

@ObjectType()
export class PureFloatAggregations {
  @Field(() => Float)
  count?: number;
}


// const X = ConvertAllFieldsTo(IngredientsSummary, PureFloatAggregations)

import { getFieldsAndDecoratorForType } from "@nestjs/graphql/dist/schema-builder/utils/get-fields-and-decorator.util";
import { Type } from '@nestjs/common';
import { enumerationExtensionName } from '../../gql2sql';

// function ConvertAllFieldsTo<C, T extends ReturnTypeFuncValue>(on: C, to: T) {
//   const fields = objectFields(on);



//   @ObjectType()
//   // @ts-ignore
//   class B extends fields.reduce((p, c) => IntersectionType(p, class { @Field(() => to) [c]?: T }), class { }) { }

//   return B;
// }


function makeNestedSummary<T extends Type<unknown>>(on: T) {
  const { fields } = getFieldsAndDecoratorForType(on);

  let props = [];

  for (const { name, typeFn } of fields) {
    const ty = typeFn();

    if (ty === ArrayAggregations) {

    }
    else if (ty === IDAggregations) {

    }
    else if (ty === StringAggregations) {

    }
    else if (ty === FloatAggregations) {

    }
    else if (ty === IntAggregations) {

    }
    else {
      // recursive case ???
    }
  }
}

makeNestedSummary(IngredientsSummary);
