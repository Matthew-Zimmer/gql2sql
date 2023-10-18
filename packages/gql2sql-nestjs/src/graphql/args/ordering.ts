import { ArgsType, Field, registerEnumType } from "@nestjs/graphql";

export enum Ordering {
  asc,
  desc,
}

registerEnumType(Ordering, {
  name: "Ordering",
  description: "Sort operations defined on fields"
});

@ArgsType()
export class OrderingArgs {
  @Field(() => Ordering, { nullable: true })
  sort?: Ordering;
}
