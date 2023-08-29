import { applyDecorators } from '@nestjs/common';
import { Extensions, ObjectType, ObjectTypeOptions } from '@nestjs/graphql';
import { relationExtensionName, tableExtensionName, variantExtensionName } from 'gql2sql';
import { Decorator } from './types';

export type VariantOfOptions = Omit<ObjectTypeOptions, 'implements'> & {
  /**
   * The column name to check the discriminator against
   * 
   * @default "kind"
   */
  column?: string,
  /**
   * The value of the discriminator column which identifies that the general sum type is this concrete type
   * 
   * @default <the table name>
   */
  tag?: string,
  /**
   * The column name on the sum type which forms the relation with this type
   * 
   * @default "id"
   */
  parentId?: string,
  /**
   * The column name on this type which forms the relation with the sum type
   * 
   * @default "id"
   */
  childId?: string,
};

/**
 * Marks an object type as a variant of a variant type These are the options of a sum type
 * 
 * @extends ObjectType
 * @extends TableExtension 
 * @extends RelationExtension
 * 
 * @param type An arrow function which returns type which this type is a variant of
 * @param name The name of the table which backs this type
 * @param options Standard Nestjs object type options plus options to configure the relation & discriminator
 */
export function VariantOf<T>(type: () => T, name: string, options?: VariantOfOptions): Decorator;

/**
 * Marks an object type as a variant of a variant type These are the options of a sum type
 * 
 * @extends ObjectType
 * @extends TableExtension 
 * @extends RelationExtension
 * 
 * @param type An arrow function which returns type which this type is a variant of
 * @param options Standard Nestjs object type options plus options to configure the relation & discriminator
 */
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
