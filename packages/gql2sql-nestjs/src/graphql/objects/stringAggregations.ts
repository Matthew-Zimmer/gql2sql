import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StringAggregations {
  @Field(() => Float, { nullable: true, description: "The count of non null values of this field in this collection" })
  count?: number;

  @Field(() => Float, { nullable: true, description: "The count of distinct non null values of this field in this collection" })
  countd?: number;

  @Field(() => [String], { nullable: true, description: "The distinct string values of this field in this collection" })
  distinct?: string[];

  @Field(() => String, { nullable: true, description: "The lexicographically maximal value of this field in this collection" })
  max?: string;

  @Field(() => String, { nullable: true, description: "The lexicographically minimum value of this field in this collection" })
  min?: string;
}
