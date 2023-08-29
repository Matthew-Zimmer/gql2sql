import { applyDecorators } from '@nestjs/common';
import { Extensions, ReturnTypeFuncValue } from '@nestjs/graphql';
import { enumerationExtensionName } from 'gql2sql';
import { ArgsField, ArgsFieldOptions } from './argsField';
import { Decorator } from './types';

/**
 * Marks a field as a enumeration field meaning it summaries over its values
 * 
 * noop for details only checked for summaries
 * 
 * @extends ArgsField
 * 
 * @param ty An arrow function returning the type of the field
 * @param options Standard Nestjs field options
 */
export function EnumerationField<T extends ReturnTypeFuncValue, A extends ReturnTypeFuncValue>(ty?: () => T, options?: ArgsFieldOptions<T, A>): Decorator;

/**
 * Marks a field as a enumeration field meaning it summaries over its values
 * 
 * noop for details only checked for summaries
 * 
 * @extends ArgsField
 * 
 * @param options Standard Nestjs field options
 */
export function EnumerationField<A extends ReturnTypeFuncValue>(options?: ArgsFieldOptions<any, A>): Decorator;

export function EnumerationField<T extends ReturnTypeFuncValue, A extends ReturnTypeFuncValue>(arg1?: ArgsFieldOptions<T, A> | (() => T), arg2?: ArgsFieldOptions<T, A>) {
  const ty = typeof arg1 === 'function' ? arg1 : undefined;
  const options = typeof arg1 === 'object' ? arg1 : arg2 ?? {};
  return applyDecorators(
    ty === undefined ? ArgsField(options) : ArgsField(ty, options as any),
    Extensions({
      [enumerationExtensionName]: {}
    })
  );
}
