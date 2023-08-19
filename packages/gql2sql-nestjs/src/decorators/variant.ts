import { applyDecorators } from '@nestjs/common';
import { Extensions, InterfaceType, InterfaceTypeOptions } from '@nestjs/graphql';
import { interfaceExtensionName, tableExtensionName } from 'gql2sql';
import { Decorator } from './types';

export type VariantOptions = Omit<InterfaceTypeOptions, 'resolveType'> & { tagColumn?: string; };

export function Variant(options?: VariantOptions): Decorator;
export function Variant(name: string, options?: VariantOptions): Decorator;
export function Variant(op1?: string | VariantOptions, op2?: VariantOptions) {
  return <F extends Function, Y>(target: F, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => {
    const name = typeof op1 === 'string' ? op1 : target.name;
    const options = typeof op1 === 'object' ? op1 : op2 ?? {};
    const tagColumn = options.tagColumn ?? 'kind';

    return applyDecorators(
      InterfaceType({
        ...options,
        resolveType: (x) => {
          return x.kind;
        },
      }),
      Extensions({
        [tableExtensionName]: { name },
        [interfaceExtensionName]: { tagColumn }
      })
    )(target, propertyKey, descriptor);
  };
}
