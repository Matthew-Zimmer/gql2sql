import { applyDecorators } from "@nestjs/common";
import { ArgsField } from "./argsField";
import { FieldOptions } from "@nestjs/graphql";
import { DateArgs } from "../graphql/args/dateArgs";
import { DateTimeISOResolver } from "graphql-scalars";

/**
 * Wrapper function for a ISO date field with date arguments in the graphql schema
 * 
 * @extends Field
 * 
 * @param options Standard Nestjs field options
 */
export function DateField(options: FieldOptions) {
  return applyDecorators(ArgsField(() => DateTimeISOResolver, {
    ...options,
    args: () => DateArgs,
  }));
}
