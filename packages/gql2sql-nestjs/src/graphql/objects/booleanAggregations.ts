import { Float, ObjectType } from '@nestjs/graphql';
import { ArgsField } from '../../decorators';
import { OrderingArgs } from '../args/ordering';

@ObjectType()
export class BooleanAggregations {
  @ArgsField(() => Float, { nullable: true, description: "The count of non null values of this field in this collection", args: () => OrderingArgs })
  count?: number;

  @ArgsField(() => Float, { nullable: true, description: "The count of distinct non null values of this field in this collection", args: () => OrderingArgs })
  countd?: number;

  @ArgsField(() => [Boolean], { nullable: true, description: "The distinct boolean values of this field in this collection", args: () => OrderingArgs })
  distinct?: boolean[];

  @ArgsField(() => Boolean, { nullable: true, description: "The max boolean value (all) of this field in this collection", args: () => OrderingArgs })
  max?: boolean;

  @ArgsField(() => Boolean, { nullable: true, description: "The min boolean value (any) of this field in this collection", args: () => OrderingArgs })
  min?: boolean;
}
