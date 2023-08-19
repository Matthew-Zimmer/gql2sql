import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ArrayAggregations {
  @Field(() => Int)
  count?: number;
}
