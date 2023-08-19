import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StringAggregations {
  @Field(() => Int)
  count?: number;

  @Field(() => [String])
  distinct?: string[];

  @Field(() => String)
  max?: string;

  @Field(() => String)
  min?: string;
}
