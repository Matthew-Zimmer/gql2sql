import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class BooleanAggregations {
  @Field(() => Int)
  count?: number;

  @Field(() => [Boolean])
  distinct?: boolean[];

  @Field(() => Boolean)
  max?: boolean;

  @Field(() => Boolean)
  min?: boolean;
}
