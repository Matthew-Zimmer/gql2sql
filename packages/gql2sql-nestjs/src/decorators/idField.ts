import { applyDecorators } from "@nestjs/common";
import { ArgsField } from "./argsField";
import { FieldOptions, ID } from "@nestjs/graphql";
import { IDArgs } from "../graphql/args/idArgs";

export function IdField(options: FieldOptions) {
  return applyDecorators(ArgsField(() => ID, {
    ...options,
    args: () => IDArgs,
  }));
}
