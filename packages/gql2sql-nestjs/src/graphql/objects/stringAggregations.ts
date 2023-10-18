import { Float, ObjectType } from '@nestjs/graphql';
import { ArgsField } from '../../decorators';
import { OrderingArgs } from '../args/ordering';

@ObjectType()
export class StringAggregations {
  @ArgsField(() => Float, { nullable: true, description: "The count of non null values of this field in this collection", args: () => OrderingArgs })
  count?: number;

  @ArgsField(() => Float, { nullable: true, description: "The count of distinct non null values of this field in this collection", args: () => OrderingArgs })
  countd?: number;

  @ArgsField(() => [String], { nullable: true, description: "The distinct string values of this field in this collection", args: () => OrderingArgs })
  distinct?: string[];

  @ArgsField(() => String, { nullable: true, description: "The lexicographically maximal value of this field in this collection", args: () => OrderingArgs })
  max?: string;

  @ArgsField(() => String, { nullable: true, description: "The lexicographically minimum value of this field in this collection", args: () => OrderingArgs })
  min?: string;
}
