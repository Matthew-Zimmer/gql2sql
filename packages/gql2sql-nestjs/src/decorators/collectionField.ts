import { applyDecorators } from '@nestjs/common';
import { Extensions, FieldOptions, ReturnTypeFuncValue } from '@nestjs/graphql';
import { collectionExtensionName } from 'gql2sql';
import { ArgsField, ArgsFieldOptions } from './argsField';
import { Decorator } from './types';
import { CollectionArgs } from '../graphql';

/**
 * Marks a field as a collection field meaning it supports detail and summary aggregations
 * 
 * @extends ArgsField
 * 
 * @param ty An arrow function returning the type of the field
 * @param options Standard Nestjs field options
 */
export function CollectionField<T extends ReturnTypeFuncValue>(ty?: () => T, options?: FieldOptions<T>): Decorator;

/**
 * Marks a field as a collection field meaning it supports detail and summary aggregations
 * 
 * @extends ArgsField
 * 
 * @param options Standard Nestjs field options
 */
export function CollectionField(options?: FieldOptions): Decorator;

export function CollectionField<T extends ReturnTypeFuncValue>(arg1?: FieldOptions<T> | (() => T), arg2?: FieldOptions<T>) {
  const ty = typeof arg1 === 'function' ? arg1 : undefined;
  const options = typeof arg1 === 'object' ? arg1 : arg2 ?? {};
  const fullOptions = {
    ...options,
    args: () => CollectionArgs,
  }
  return applyDecorators(
    ty === undefined ? ArgsField(fullOptions) : ArgsField(ty, fullOptions as any),
    Extensions({
      [collectionExtensionName]: {}
    })
  );
}
