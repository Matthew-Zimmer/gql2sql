import { Float, ObjectType } from '@nestjs/graphql';
import { ArgsField } from '../../decorators';
import { OrderingArgs } from '../args/ordering';
import { DateTimeISOResolver } from 'graphql-scalars';

@ObjectType()
export class DateAggregations {
  @ArgsField(() => Float, { nullable: true, description: "The count of non null values of this field in this collection", args: () => OrderingArgs, defaultValue: 0 })
  count?: number;

  @ArgsField(() => Float, { nullable: true, description: "The count of distinct non null values of this field in this collection", args: () => OrderingArgs, defaultValue: 0 })
  countd?: number;

  @ArgsField(() => [DateTimeISOResolver], { nullable: true, description: "The distinct number values of this field in this collection", args: () => OrderingArgs })
  distinct?: Date[];

  @ArgsField(() => DateTimeISOResolver, { nullable: true, description: "The maximal value of this field in this collection", args: () => OrderingArgs })
  max?: Date;

  @ArgsField(() => DateTimeISOResolver, { nullable: true, description: "The minimum value of this field in this collection", args: () => OrderingArgs })
  min?: Date;
}
