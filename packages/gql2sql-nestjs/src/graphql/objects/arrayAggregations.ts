import { Float, ObjectType } from '@nestjs/graphql';
import { ArgsField } from '../../decorators';
import { OrderingArgs } from '../args/ordering';

@ObjectType()
export class ArrayAggregations {
  @ArgsField(() => Float, { nullable: true, description: "The count of non null values of this field in this collection", args: () => OrderingArgs, defaultValue: 0 })
  count?: number;

  @ArgsField(() => Float, { nullable: true, description: "The count of distinct non null values of this field in this collection", args: () => OrderingArgs, defaultValue: 0 })
  countd?: number;
}
