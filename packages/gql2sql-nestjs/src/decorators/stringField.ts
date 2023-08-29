import { applyDecorators } from "@nestjs/common";
import { ArgsField } from "./argsField";
import { FieldOptions } from "@nestjs/graphql";
import { StringArgs } from "../graphql/args/stringArgs";

/**
 * Wrapper function for a string field with string arguments in the graphql schema
 * 
 * @extends Field
 * 
 * @param options Standard Nestjs field options
 */
export function StringField(options: FieldOptions) {
  return applyDecorators(ArgsField(() => String, {
    ...options,
    args: () => StringArgs,
  }));
}
