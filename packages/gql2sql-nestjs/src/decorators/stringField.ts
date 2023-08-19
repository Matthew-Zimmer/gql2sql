import { applyDecorators } from "@nestjs/common";
import { ArgsField } from "./argsField";
import { FieldOptions } from "@nestjs/graphql";
import { StringArgs } from "../graphql/args/stringArgs";

export function StringField(options: FieldOptions) {
  return applyDecorators(ArgsField(() => String, {
    ...options,
    args: () => StringArgs,
  }));
}
