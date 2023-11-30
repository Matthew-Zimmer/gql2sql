import { ArgsType, Field } from "@nestjs/graphql";
import { DateTimeISOResolver } from "graphql-scalars";
import { Ordering } from "./ordering";

@ArgsType()
export class DateArgs {
  @Field(() => DateTimeISOResolver, { nullable: true, description: "Adds a filter to this field such that only the provided value is included in the collection" })
  eq?: Date;

  @Field(() => DateTimeISOResolver, { nullable: true, description: "Adds a filter to this field such that the provided value is excluded from the collection" })
  neq?: Date;

  @Field(() => DateTimeISOResolver, { nullable: true, description: "Adds a filter to this field such that only values greater than (strictly afterwards) the provided value are included in the collection" })
  gt?: Date;

  @Field(() => DateTimeISOResolver, { nullable: true, description: "Adds a filter to this field such that only values greater than or equal (afterwards and including) to the provided value are included in the collection" })
  gteq?: Date;

  @Field(() => DateTimeISOResolver, { nullable: true, description: "Adds a filter to this field such that only values less than (strictly before) the provided value are included in the collection" })
  lt?: Date;

  @Field(() => DateTimeISOResolver, { nullable: true, description: "Adds a filter to this field such that only values less than or equal (before and including) to the provided value are included in the collection" })
  lteq?: Date;

  @Field(() => [DateTimeISOResolver], { nullable: true, description: "Adds a filter to this field such that any value in the array are included in the collection" })
  in?: Date[];

  @Field(() => [DateTimeISOResolver], { nullable: true, description: "Adds a filter to this field such that all values in the array are excluded from the collection" })
  notIn?: Date[];

  @Field(() => Boolean, { nullable: true, description: "Adds a filter to this field such that the field is null or not (positive case)" })
  isNull?: boolean;

  @Field(() => Boolean, { nullable: true, description: "Marks a filter on this field as optional when filtering parent collections hence this has no effect on the root collection " })
  opt?: boolean;

  @Field(() => Ordering, { nullable: true, description: "Adds a sort operation to this field in this collection" })
  sort?: Ordering;
}
