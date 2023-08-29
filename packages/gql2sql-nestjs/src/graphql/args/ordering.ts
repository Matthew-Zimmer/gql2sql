import { registerEnumType } from "@nestjs/graphql";

export enum Ordering {
  asc,
  desc,
}

registerEnumType(Ordering, {
  name: "Ordering",
  description: "Sort operations defined on fields"
});
