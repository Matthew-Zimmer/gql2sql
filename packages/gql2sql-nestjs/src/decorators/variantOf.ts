import { applyDecorators } from '@nestjs/common';
import { Extensions, ObjectType, ObjectTypeOptions } from '@nestjs/graphql';
import { relationExtensionName, tableExtensionName, variantExtensionName } from 'gql2sql';
import { Decorator } from './types';

export type VariantOfOptions = Omit<ObjectTypeOptions, 'implements'> & { column?: string; tag?: string; parentId?: string; childId?: string; };

export function VariantOf<T>(type: () => T, name: string, options?: VariantOfOptions): Decorator;
export function VariantOf<T>(type: () => T, options?: VariantOfOptions): Decorator;
export function VariantOf<T>(type: () => T, op1?: string | VariantOfOptions, op2?: VariantOfOptions) {
  return <F extends Function, Y>(target: F, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => {
    const name = typeof op1 === 'string' ? op1 : target.name;
    const options = typeof op1 === 'object' ? op1 : op2 ?? {};
    const tag = options.tag ?? name;
    const column = options.column ?? 'kind';
    const parentId = options.parentId ?? 'id';
    const childId = options.childId ?? 'id';

    return applyDecorators(
      ObjectType({ ...options, implements: type }),
      Extensions({
        [tableExtensionName]: { name },
        [variantExtensionName]: { tag: { column, value: tag } },
        [relationExtensionName]: [{ parentId, to: name, childId }]
      })
    )(target, propertyKey, descriptor);
  };
}
