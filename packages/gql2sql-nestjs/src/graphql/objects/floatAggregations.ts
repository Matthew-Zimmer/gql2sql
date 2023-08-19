import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FloatAggregations {
  @Field(() => Int)
  count?: number;

  @Field(() => [Float])
  distinct?: number[];

  @Field(() => Float)
  sum?: number;

  @Field(() => Float)
  max?: number;

  @Field(() => Float)
  min?: number;

  @Field(() => Float)
  avg?: number;

  @Field(() => Float)
  std?: number;
}
