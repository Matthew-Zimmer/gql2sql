import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class IDAggregations {
  @Field(() => Int)
  count?: number;

  @Field(() => [ID])
  distinct?: string[];
}
