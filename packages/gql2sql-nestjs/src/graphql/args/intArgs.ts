import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Ordering } from './ordering';

@ArgsType()
export class IntArgs {
  @Field(() => Int, { nullable: true, description: "Adds a filter to this field such that only the provided value is included in the collection" })
  eq?: number;

  @Field(() => Int, { nullable: true, description: "Adds a filter to this field such that the provided value is excluded from the collection" })
  neq?: number;

  @Field(() => Int, { nullable: true, description: "Adds a filter to this field such that only values greater than the provided value are included in the collection" })
  gt?: number;

  @Field(() => Int, { nullable: true, description: "Adds a filter to this field such that only values greater than or equal to the provided value are included in the collection" })
  lt?: number;

  @Field(() => Int, { nullable: true, description: "Adds a filter to this field such that only values less than the provided value are included in the collection" })
  gteq?: number;

  @Field(() => Int, { nullable: true, description: "Adds a filter to this field such that only values less than or equal to the provided value are included in the collection" })
  lteq?: number;

  @Field(() => [Int], { nullable: true, description: "Adds a filter to this field such that any value in the array are included in the collection" })
  in?: number[];

  @Field(() => [Int], { nullable: true, description: "Adds a filter to this field such that all values in the array are excluded from the collection" })
  notIn?: number[];

  @Field(() => Boolean, { nullable: true, description: "Adds a filter to this field such that the field is null or not (positive case)" })
  isNull?: boolean;

  @Field(() => Boolean, { nullable: true, description: "Adds a filter to this field such that the field is null or not (negative case)" })
  isNotNull?: boolean;

  @Field(() => Boolean, { nullable: true, description: "Marks a filter on this field as optional when filtering parent collections hence this has no effect on the root collection " })
  opt?: boolean;

  @Field(() => Ordering, { nullable: true, description: "Adds a sort operation to this field in this collection" })
  sort?: Ordering;
}
