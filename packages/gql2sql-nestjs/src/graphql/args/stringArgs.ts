import { ArgsType, Field } from '@nestjs/graphql';
import { Ordering } from './ordering';

@ArgsType()
export class StringArgs {
  @Field(() => String, { nullable: true, description: "Adds a filter to this field such that only the provided value is included in the collection" })
  eq?: string;

  @Field(() => String, { nullable: true, description: "Adds a filter to this field such that the provided value is excluded from the collection" })
  neq?: string;

  @Field(() => String, { nullable: true, description: "Adds a filter to this field such that only values that are like the provided value are included in the collection" })
  like?: string;

  @Field(() => String, { nullable: true, description: "Adds a filter to this field such that only values that are not like the provided value are included in the collection" })
  notLike?: string;

  @Field(() => String, { nullable: true, description: "Adds a filter to this field such that only values that are case sensitive like the provided value are included in the collection" })
  ilike?: string;

  @Field(() => String, { nullable: true, description: "Adds a filter to this field such that only values that are not case sensitive like the provided value are included in the collection" })
  notILike?: string;

  @Field(() => [String], { nullable: true, description: "Adds a filter to this field such that any value in the array are included in the collection" })
  in?: string[];

  @Field(() => [String], { nullable: true, description: "Adds a filter to this field such that all values in the array are excluded from the collection" })
  notIn?: string[];

  @Field(() => Boolean, { nullable: true, description: "Adds a filter to this field such that the field is null or not (positive case)" })
  isNull?: boolean;

  @Field(() => Boolean, { nullable: true, description: "Marks a filter on this field as optional when filtering parent collections hence this has no effect on the root collection " })
  opt?: boolean;

  @Field(() => Ordering, { nullable: true, description: "Adds a sort operation to this field in this collection" })
  sort?: Ordering;
}
