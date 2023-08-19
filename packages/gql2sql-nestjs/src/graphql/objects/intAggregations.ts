import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class IntAggregations {
  @Field(() => Int)
  count?: number;

  @Field(() => [Int])
  distinct?: number[];

  @Field(() => Int)
  sum?: number;

  @Field(() => Int)
  max?: number;

  @Field(() => Int)
  min?: number;

  @Field(() => Float)
  avg?: number;

  @Field(() => Float)
  std?: number;
}
