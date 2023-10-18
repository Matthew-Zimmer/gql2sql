import { ID, Float, ObjectType } from '@nestjs/graphql';
import { ArgsField } from '../../decorators';
import { OrderingArgs } from '../args/ordering';

@ObjectType()
export class IDAggregations {
  @ArgsField(() => Float, { nullable: true, description: "The count of non null values of this field in this collection", args: () => OrderingArgs })
  count?: number;

  @ArgsField(() => Float, { nullable: true, description: "The count of distinct non null values of this field in this collection", args: () => OrderingArgs })
  countd?: number;

  @ArgsField(() => [ID], { nullable: true, description: "The distinct id values of this field in this collection", args: () => OrderingArgs })
  distinct?: string[];
}
