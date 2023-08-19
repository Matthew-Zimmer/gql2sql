import { applyDecorators } from '@nestjs/common';
import { Extensions, ReturnTypeFuncValue } from '@nestjs/graphql';
import { collectionExtensionName } from 'gql2sql';
import { ArgsField, ArgsFieldOptions } from './argsField';
import { Decorator } from './types';

export function CollectionField<T extends ReturnTypeFuncValue, A extends ReturnTypeFuncValue>(ty?: () => T, options?: ArgsFieldOptions<T, A>): Decorator;
export function CollectionField<A extends ReturnTypeFuncValue>(options?: ArgsFieldOptions<any, A>): Decorator;
export function CollectionField<T extends ReturnTypeFuncValue, A extends ReturnTypeFuncValue>(arg1?: ArgsFieldOptions<T, A> | (() => T), arg2?: ArgsFieldOptions<T, A>) {
  const ty = typeof arg1 === 'function' ? arg1 : undefined;
  const options = typeof arg1 === 'object' ? arg1 : arg2 ?? {};
  const fullOptions = { ...options, middleware: [...options?.middleware ?? [], async (_ctx: any, next: any) => (await next()) ?? {}] };
  return applyDecorators(
    ty === undefined ? ArgsField(fullOptions) : ArgsField(ty, fullOptions as any),
    Extensions({
      [collectionExtensionName]: {}
    })
  );
}
