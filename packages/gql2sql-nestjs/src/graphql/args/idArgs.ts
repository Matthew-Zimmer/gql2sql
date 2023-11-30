import { ArgsType, Field, ID } from '@nestjs/graphql';
import { Ordering } from './ordering';

@ArgsType()
export class IDArgs {
  @Field(() => ID, { nullable: true, description: "Adds a filter to this field such that only the provided value is included in the collection" })
  eq?: string;

  @Field(() => ID, { nullable: true, description: "Adds a filter to this field such that the provided value is excluded from the collection" })
  neq?: string;

  @Field(() => [ID], { nullable: true, description: "Adds a filter to this field such that any value in the array are included in the collection" })
  in?: string[];

  @Field(() => [ID], { nullable: true, description: "Adds a filter to this field such that all values in the array are excluded from the collection" })
  notIn?: string[];

  @Field(() => Boolean, { nullable: true, description: "Adds a filter to this field such that the field is null or not (positive case)" })
  isNull?: boolean;

  @Field(() => Boolean, { nullable: true, description: "Marks a filter on this field as optional when filtering parent collections hence this has no effect on the root collection " })
  opt?: boolean;

  @Field(() => Ordering, { nullable: true, description: "Adds a sort operation to this field in this collection" })
  sort?: Ordering;
}
