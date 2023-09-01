import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class NumberAggregations {
  @Field(() => Float, { nullable: true, description: "The count of non null values of this field in this collection" })
  count?: number;

  @Field(() => Float, { nullable: true, description: "The count of distinct non null values of this field in this collection" })
  countd?: number;

  @Field(() => [Float], { nullable: true, description: "The distinct number values of this field in this collection" })
  distinct?: number[];

  @Field(() => Float, { nullable: true, description: "The sum of values of this field in this collection" })
  sum?: number;

  @Field(() => Float, { nullable: true, description: "The maximal value of this field in this collection" })
  max?: number;

  @Field(() => Float, { nullable: true, description: "The minimum value of this field in this collection" })
  min?: number;

  @Field(() => Float, { nullable: true, description: "The average value of this field in this collection" })
  avg?: number;

  @Field(() => Float, { nullable: true, description: "The sample standard deviation value of this field in this collection" })
  std?: number;

  @Field(() => Float, { nullable: true, description: "The population standard deviation value of this field in this collection" })
  stdp?: number;

  @Field(() => Float, { nullable: true, description: "The population variance value of this field in this collection" })
  var?: number;

  @Field(() => Float, { nullable: true, description: "The population variance value of this field in this collection" })
  varp?: number;
}
