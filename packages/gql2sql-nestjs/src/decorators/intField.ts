import { applyDecorators } from "@nestjs/common";
import { ArgsField } from "./argsField";
import { FieldOptions, Int } from "@nestjs/graphql";
import { IntArgs } from "../graphql/args/intArgs";

/**
 * Wrapper function for an integer field with integer arguments in the graphql schema
 * 
 * @extends Field
 * 
 * @param options Standard Nestjs field options
 */
export function IntField(options: FieldOptions) {
  return applyDecorators(ArgsField(() => Int, {
    ...options,
    args: () => IntArgs,
  }));
}
