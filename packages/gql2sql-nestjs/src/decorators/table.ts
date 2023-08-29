import { applyDecorators } from '@nestjs/common';
import { Extensions, ObjectType, ObjectTypeOptions } from '@nestjs/graphql';
import { tableExtensionName } from 'gql2sql';
import { Decorator } from './types';

/**
 * Marks an object types as being backed by a table
 * 
 * @extends ObjectType
 * 
 * @param options Standard Nestjs object type options
 */
export function Table(options?: ObjectTypeOptions): Decorator;

/**
 * Marks an object types as being backed by a table
 * 
 * @extends ObjectType
 * 
 * @param name The name of the table which backs this object type useful when the object typename and table do not match
 * @param options Standard Nestjs object type options
 */
export function Table(name: string, options?: ObjectTypeOptions): Decorator;

export function Table(op1?: ObjectTypeOptions | string, op2?: ObjectTypeOptions) {
  return <F extends Function, Y>(target: F, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => {
    const name = typeof op1 === 'string' ? op1 : target.name;
    const options = typeof op1 === 'object' ? op1 : op2 ?? {};
    return applyDecorators(
      ObjectType(options),
      Extensions({
        [tableExtensionName]: { name }
      })
    )(target, propertyKey, descriptor);
  };
}
