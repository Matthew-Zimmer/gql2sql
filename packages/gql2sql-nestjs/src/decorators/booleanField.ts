import { applyDecorators } from "@nestjs/common";
import { ArgsField } from "./argsField";
import { FieldOptions } from "@nestjs/graphql";
import { BooleanArgs } from "../graphql/args/booleanArgs";

/**
 * Wrapper function for a boolean field with boolean arguments in the graphql schema
 * 
 * @extends Field
 * 
 * @param options Standard Nestjs field options
 */
export function BooleanField(options: FieldOptions) {
  return applyDecorators(ArgsField(() => Boolean, {
    ...options,
    args: () => BooleanArgs,
  }));
}
