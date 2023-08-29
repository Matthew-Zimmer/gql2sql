import { applyDecorators } from "@nestjs/common";
import { ArgsField } from "./argsField";
import { FieldOptions, Float } from "@nestjs/graphql";
import { FloatArgs } from "../graphql/args/floatArgs";

/**
 * Wrapper function for a float field with float arguments in the graphql schema
 * 
 * @extends Field
 * 
 * @param options Standard Nestjs field options
 */
export function FloatField(options: FieldOptions) {
  return applyDecorators(ArgsField(() => Float, {
    ...options,
    args: () => FloatArgs,
  }));
}
