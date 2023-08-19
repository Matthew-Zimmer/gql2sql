import { applyDecorators } from "@nestjs/common";
import { ArgsField } from "./argsField";
import { FieldOptions, Float } from "@nestjs/graphql";
import { FloatArgs } from "../graphql/args/floatArgs";

export function FloatField(options: FieldOptions) {
  return applyDecorators(ArgsField(() => Float, {
    ...options,
    args: () => FloatArgs,
  }));
}
