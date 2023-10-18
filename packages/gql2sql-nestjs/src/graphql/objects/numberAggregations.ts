import { Float, ObjectType } from '@nestjs/graphql';
import { ArgsField } from '../../decorators';
import { OrderingArgs } from '../args/ordering';

@ObjectType()
export class NumberAggregations {
  @ArgsField(() => Float, { nullable: true, description: "The count of non null values of this field in this collection", args: () => OrderingArgs })
  count?: number;

  @ArgsField(() => Float, { nullable: true, description: "The count of distinct non null values of this field in this collection", args: () => OrderingArgs })
  countd?: number;

  @ArgsField(() => [Float], { nullable: true, description: "The distinct number values of this field in this collection", args: () => OrderingArgs })
  distinct?: number[];

  @ArgsField(() => Float, { nullable: true, description: "The sum of values of this field in this collection", args: () => OrderingArgs })
  sum?: number;

  @ArgsField(() => Float, { nullable: true, description: "The maximal value of this field in this collection", args: () => OrderingArgs })
  max?: number;

  @ArgsField(() => Float, { nullable: true, description: "The minimum value of this field in this collection", args: () => OrderingArgs })
  min?: number;

  @ArgsField(() => Float, { nullable: true, description: "The average value of this field in this collection", args: () => OrderingArgs })
  avg?: number;

  @ArgsField(() => Float, { nullable: true, description: "The sample standard deviation value of this field in this collection", args: () => OrderingArgs })
  std?: number;

  @ArgsField(() => Float, { nullable: true, description: "The population standard deviation value of this field in this collection", args: () => OrderingArgs })
  stdp?: number;

  @ArgsField(() => Float, { nullable: true, description: "The population variance value of this field in this collection", args: () => OrderingArgs })
  var?: number;

  @ArgsField(() => Float, { nullable: true, description: "The population variance value of this field in this collection", args: () => OrderingArgs })
  varp?: number;
}
