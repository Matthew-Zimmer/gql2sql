import { applyDecorators } from '@nestjs/common';
import { Extensions, InterfaceType, InterfaceTypeOptions } from '@nestjs/graphql';
import { interfaceExtensionName, tableExtensionName } from 'gql2sql';
import { Decorator } from './types';

export type VariantOptions = Omit<InterfaceTypeOptions, 'resolveType'> & {
  /**
   * The name of the column to use as the sum type discriminator
   */
  tagColumn?: string;
  tagColumnAlias?: string,
};

/**
 * Marks an object type as a variant for modeling sum types
 * 
 * @extends InterfaceType
 * @extends TableExtension 
 * 
 * @param options Standard nestjs object type options plus a required `tagColumn` used as the sum type discriminator
 */
export function Variant(options?: VariantOptions): Decorator;

/**
 * Marks an object type as a variant for modeling sum types, implies `Table`
 * 
 * @extends InterfaceType
 * @extends TableExtension
 * 
 * @param name The name of the table which backs this object type useful when the object typename and table do not match
 * @param options Standard nestjs object type options plus a required `tagColumn` used as the sum type discriminator
 */
export function Variant(name: string, options?: VariantOptions): Decorator;

export function Variant(op1?: string | VariantOptions, op2?: VariantOptions) {
  return <F extends Function, Y>(target: F, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => {
    const name = typeof op1 === 'string' ? op1 : target.name;
    const options = typeof op1 === 'object' ? op1 : op2 ?? {};
    const tagColumn = options.tagColumn ?? 'kind';
    const tagColumnAlias = options.tagColumnAlias ?? tagColumn;

    return applyDecorators(
      InterfaceType({
        ...options,
        resolveType: (x) => {
          return x[tagColumnAlias];
        },
      }),
      Extensions({
        [tableExtensionName]: { name },
        [interfaceExtensionName]: { tagColumn, tagColumnAlias }
      })
    )(target, propertyKey, descriptor);
  };
}
