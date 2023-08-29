import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class BooleanAggregations {
  @Field(() => Float, { nullable: true, description: "The count of non null values of this field in this collection" })
  count?: number;

  @Field(() => Float, { nullable: true, description: "The count of distinct non null values of this field in this collection" })
  countd?: number;

  @Field(() => [Boolean], { nullable: true, description: "The distinct boolean values of this field in this collection" })
  distinct?: boolean[];

  @Field(() => Boolean, { nullable: true, description: "The max boolean value (all) of this field in this collection" })
  max?: boolean;

  @Field(() => Boolean, { nullable: true, description: "The min boolean value (any) of this field in this collection" })
  min?: boolean;
}
