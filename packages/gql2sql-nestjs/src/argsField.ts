/**
 * Extend the base `Field` decorator with args type since resolve field args has a big performance hit
 */

import { Type } from '@nestjs/common';
import { isFunction } from '@nestjs/common/utils/shared.utils';
import { FieldOptions, NumberScalarMode } from '@nestjs/graphql';
import {
  GqlTypeReference,
  ReturnTypeFunc,
  ReturnTypeFuncValue,
} from '@nestjs/graphql/dist/interfaces/return-type-func.interface';
import { LazyMetadataStorage } from '@nestjs/graphql/dist/schema-builder/storages/lazy-metadata.storage';
import { TypeMetadataStorage } from '@nestjs/graphql/dist/schema-builder/storages/type-metadata.storage';
import { reflectTypeFromMetadata } from '@nestjs/graphql/dist/utils/reflection.utilts';

export type ArgsFieldOptions<T, A> = FieldOptions<T> & { args?: () => A }

type ArgsFieldOptionsExtractor<T, A> = T extends [GqlTypeReference<infer P>]
  ? ArgsFieldOptions<P[], A>
  : T extends GqlTypeReference<infer P>
  ? ArgsFieldOptions<P, A>
  : never;

/**
 * @ArgsField() decorator is used to mark a specific class property as a GraphQL field.
 * Only properties decorated with this decorator will be defined in the schema.
 */
export function ArgsField(): PropertyDecorator & MethodDecorator;
/**
 * @ArgsField() decorator is used to mark a specific class property as a GraphQL field.
 * Only properties decorated with this decorator will be defined in the schema.
 */
export function ArgsField<T extends ReturnTypeFuncValue, A extends ReturnTypeFuncValue>(
  options: ArgsFieldOptionsExtractor<T, A>,
): PropertyDecorator & MethodDecorator;
/**
 * @ArgsField() decorator is used to mark a specific class property as a GraphQL field.
 * Only properties decorated with this decorator will be defined in the schema.
 */
export function ArgsField<T extends ReturnTypeFuncValue, A extends ReturnTypeFuncValue>(
  returnTypeFunction?: ReturnTypeFunc<T>,
  options?: ArgsFieldOptionsExtractor<T, A>,
): PropertyDecorator & MethodDecorator;

/**
 * @ArgsField() decorator is used to mark a specific class property as a GraphQL field.
 * Only properties decorated with this decorator will be defined in the schema.
 */
export function ArgsField<T extends ReturnTypeFuncValue, A extends ReturnTypeFuncValue>(
  typeOrOptions?: ReturnTypeFunc<T> | ArgsFieldOptionsExtractor<T, A>,
  fieldOptions?: ArgsFieldOptionsExtractor<T, A>,
): PropertyDecorator & MethodDecorator {
  return (
    prototype: Object,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {
    addArgsFieldMetadata(
      typeOrOptions,
      fieldOptions,
      prototype,
      propertyKey,
      descriptor,
    );
  };
}

export function addArgsFieldMetadata<T extends ReturnTypeFuncValue, A extends ReturnTypeFuncValue>(
  typeOrOptions: ReturnTypeFunc<T> | ArgsFieldOptionsExtractor<T, A> | undefined,
  fieldOptions: ArgsFieldOptionsExtractor<T, A> | undefined,
  prototype: Object,
  propertyKey?: string | symbol,
  descriptor?: TypedPropertyDescriptor<any>,
  loadEagerly?: boolean,
) {
  if (propertyKey === undefined || typeof propertyKey === 'symbol') throw new Error(`Bad config propertyKey: ${String(propertyKey)} needs to be a string`);

  const [typeFunc, options = {}] = isFunction(typeOrOptions)
    ? [typeOrOptions, fieldOptions]
    : [undefined, typeOrOptions as any];

  const applyMetadataFn = () => {
    const isResolver = !!descriptor;
    const isResolverMethod = !!(descriptor && descriptor.value);

    const { typeFn: getType, options: typeOptions } = reflectTypeFromMetadata({
      metadataKey: isResolverMethod ? 'design:returntype' : 'design:type',
      prototype,
      propertyKey,
      explicitTypeFn: typeFunc as ReturnTypeFunc<T>,
      typeOptions: options,
      ignoreOnUndefinedType: loadEagerly,
    });

    TypeMetadataStorage.addClassFieldMetadata({
      name: propertyKey,
      schemaName: options.name || propertyKey,
      typeFn: getType!,
      options: typeOptions,
      target: prototype.constructor,
      description: options.description,
      deprecationReason: options.deprecationReason,
      complexity: options.complexity,
      middleware: options.middleware,
      ...(options.args ? {} : {
        methodArgs: [{
          index: 0,
          kind: "args",
          methodName: options.name || propertyKey,
          options: {},
          target: prototype.constructor,
          typeFn: options.args,
        }],
      })
    });

    if (isResolver) {
      TypeMetadataStorage.addResolverPropertyMetadata({
        kind: 'internal',
        methodName: propertyKey,
        schemaName: options.name || propertyKey,
        target: prototype.constructor,
        complexity: options.complexity,
      });
    }
  };
  if (loadEagerly) {
    applyMetadataFn();
  } else {
    LazyMetadataStorage.store(
      prototype.constructor as Type<unknown>,
      applyMetadataFn,
      { isField: true },
    );
  }
}
