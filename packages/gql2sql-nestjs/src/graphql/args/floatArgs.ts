import { ArgsType, Field, Float } from '@nestjs/graphql';
import { Ordering } from './ordering';

@ArgsType()
export class FloatArgs {
  @Field(() => Float, { nullable: true, description: "Adds a filter to this field such that only the provided value is included in the collection" })
  eq?: number;

  @Field(() => Float, { nullable: true, description: "Adds a filter to this field such that the provided value is excluded from the collection" })
  neq?: number;

  @Field(() => Float, { nullable: true, description: "Adds a filter to this field such that only values greater than the provided value are included in the collection" })
  gt?: number;

  @Field(() => Float, { nullable: true, description: "Adds a filter to this field such that only values greater than or equal to the provided value are included in the collection" })
  gteq?: number;

  @Field(() => Float, { nullable: true, description: "Adds a filter to this field such that only values less than the provided value are included in the collection" })
  lt?: number;

  @Field(() => Float, { nullable: true, description: "Adds a filter to this field such that only values less than or equal the provided value are included in the collection" })
  lteq?: number;

  @Field(() => [Float], { nullable: true, description: "Adds a filter to this field such that any value in the array are included in the collection" })
  in?: number[];

  @Field(() => [Float], { nullable: true, description: "Adds a filter to this field such that all values in the array are excluded from the collection" })
  notIn?: number[];

  @Field(() => Boolean, { nullable: true, description: "Adds a filter to this field such that the field is null or not (positive case)" })
  isNull?: boolean;

  @Field(() => Boolean, { nullable: true, description: "Marks a filter on this field as optional when filtering parent collections hence this has no effect on the root collection " })
  opt?: boolean;

  @Field(() => Ordering, { nullable: true, description: "Adds a sort operation to this field in this collection" })
  sort?: Ordering;
}
