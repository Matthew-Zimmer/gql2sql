import { applyDecorators } from "@nestjs/common";
import { ArgsField } from "./argsField";
import { FieldOptions } from "@nestjs/graphql";
import { BooleanArgs } from "../graphql/args/booleanArgs";

export function BooleanField(options: FieldOptions) {
  return applyDecorators(ArgsField(() => Boolean, {
    ...options,
    args: () => BooleanArgs,
  }));
}
