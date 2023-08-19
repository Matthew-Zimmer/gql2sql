import { applyDecorators } from "@nestjs/common";
import { ArgsField } from "./argsField";
import { FieldOptions, Int } from "@nestjs/graphql";
import { IntArgs } from "../graphql/args/intArgs";

export function IntField(options: FieldOptions) {
  return applyDecorators(ArgsField(() => Int, {
    ...options,
    args: () => IntArgs,
  }));
}
