import { applyDecorators } from "@nestjs/common";
import { ArgsField } from "./argsField";
import { FieldOptions, ID } from "@nestjs/graphql";
import { IDArgs } from "../graphql/args/idArgs";

/**
 * Wrapper function for an id field with id arguments in the graphql schema
 * 
 * @extends Field
 * 
 * @param options Standard Nestjs field options
 */
export function IdField(options: FieldOptions) {
  return applyDecorators(ArgsField(() => ID, {
    ...options,
    args: () => IDArgs,
  }));
}
