import { Field, ID, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class IDAggregations {
  @Field(() => Float, { nullable: true, description: "The count of non null values of this field in this collection" })
  count?: number;

  @Field(() => Float, { nullable: true, description: "The count of distinct non null values of this field in this collection" })
  countd?: number;

  @Field(() => [ID], { nullable: true, description: "The distinct id values of this field in this collection" })
  distinct?: string[];
}
