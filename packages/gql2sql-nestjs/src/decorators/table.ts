import { applyDecorators } from '@nestjs/common';
import { Extensions, ObjectType, ObjectTypeOptions } from '@nestjs/graphql';
import { tableExtensionName } from 'gql2sql';
import { Decorator } from './types';

export function Table(options?: ObjectTypeOptions): Decorator;
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
