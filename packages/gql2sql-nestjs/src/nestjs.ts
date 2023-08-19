import { applyDecorators } from '@nestjs/common';
import { ArgsType, Extensions, Field, Float, ID, Int, InterfaceType, InterfaceTypeOptions, ObjectType, ObjectTypeOptions, ReturnTypeFuncValue } from '@nestjs/graphql';
import { aliasExtensionName, collectionExtensionName, interfaceExtensionName, relationExtensionName, tableExtensionName, variantExtensionName } from 'gql2sql';
import { ArgsField, ArgsFieldOptions } from './argsField';

type Decorator = ReturnType<typeof applyDecorators>

export function Relation(parentId: string, to: string, childId: string): Decorator;
export function Relation(parentId: string, mapping: string, mappingParentId: string, mappingChildId: string, to: string, childId: string): Decorator;
export function Relation(...args: string[]) {
  return applyDecorators(
    Extensions({
      [relationExtensionName]: args.length === 3 ?
        [{ parentId: args[0], to: args[1], childId: args[2] }] :
        [{ parentId: args[0], to: args[1], childId: args[2] }, { parentId: args[3], to: args[4], childId: args[5] }]
    })
  );
}

export function Alias(name: string) {
  return applyDecorators(
    Extensions({
      [aliasExtensionName]: { name }
    })
  );
}

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
    )(target, propertyKey, descriptor)
  };
}

export function CollectionField<T extends ReturnTypeFuncValue, A extends ReturnTypeFuncValue>(ty?: () => T, options?: ArgsFieldOptions<T, A>): Decorator;
export function CollectionField<A extends ReturnTypeFuncValue>(options?: ArgsFieldOptions<any, A>): Decorator;
export function CollectionField<T extends ReturnTypeFuncValue, A extends ReturnTypeFuncValue>(arg1?: ArgsFieldOptions<T, A> | (() => T), arg2?: ArgsFieldOptions<T, A>) {
  const ty = typeof arg1 === 'function' ? arg1 : undefined;
  const options = typeof arg1 === 'object' ? arg1 : arg2 ?? {};
  const fullOptions = { ...options, middleware: [...options?.middleware ?? [], async (ctx: any, next: any) => (await next()) ?? {}] };
  return applyDecorators(
    ty === undefined ? ArgsField(fullOptions) : ArgsField(ty, fullOptions as any),
    Extensions({
      [collectionExtensionName]: {}
    }),
  );
}

type VariantOptions = Omit<InterfaceTypeOptions, 'resolveType'> & { tagColumn?: string };

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
      }),
    )(target, propertyKey, descriptor)
  };
}

type VariantOfOptions = Omit<ObjectTypeOptions, 'implements'> & { column?: string, tag?: string, parentId?: string, childId?: string };

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
    )(target, propertyKey, descriptor)
  };
}

@ObjectType()
export class ArrayAggregations {
  @Field(() => Int)
  // @ts-expect-error
  count: number;
}

@ObjectType()
export class IntAggregations {
  @Field(() => Int)
  // @ts-expect-error
  count: number;

  @Field(() => [Int])
  // @ts-expect-error
  distinct: number[];

  @Field(() => Int)
  // @ts-expect-error
  sum: number;

  @Field(() => Int)
  // @ts-expect-error
  max: number;

  @Field(() => Int)
  // @ts-expect-error
  min: number;

  @Field(() => Float)
  // @ts-expect-error
  avg: number;

  @Field(() => Float)
  // @ts-expect-error
  std: number;
}

@ObjectType()
export class FloatAggregations {
  @Field(() => Int)
  // @ts-expect-error
  count: number;

  @Field(() => [Float])
  // @ts-expect-error
  distinct: number[];

  @Field(() => Float)
  // @ts-expect-error
  sum: number;

  @Field(() => Float)
  // @ts-expect-error
  max: number;

  @Field(() => Float)
  // @ts-expect-error
  min: number;

  @Field(() => Float)
  // @ts-expect-error
  avg: number;

  @Field(() => Float)
  // @ts-expect-error
  std: number;
}

@ObjectType()
export class IDAggregations {
  @Field(() => Int)
  // @ts-expect-error
  count: number;

  @Field(() => [ID])
  // @ts-expect-error
  distinct: string[];
}

@ObjectType()
export class StringAggregations {
  @Field(() => Int)
  // @ts-expect-error
  count: number;

  @Field(() => [String])
  // @ts-expect-error
  distinct: string[];

  @Field(() => String)
  // @ts-expect-error
  max: string;

  @Field(() => String)
  // @ts-expect-error
  min: string;
}

@ObjectType()
export class BooleanAggregations {
  @Field(() => Int)
  // @ts-expect-error
  count: number;

  @Field(() => [Boolean])
  // @ts-expect-error
  distinct: boolean[];

  @Field(() => Boolean)
  // @ts-expect-error
  max: boolean;

  @Field(() => Boolean)
  // @ts-expect-error
  min: boolean;
}

@ArgsType()
export class IntArgs {
  @Field(() => Int, { nullable: true })
  // @ts-expect-error
  eq: number;

  @Field(() => Int, { nullable: true })
  // @ts-expect-error
  neq: number;

  @Field(() => Int, { nullable: true })
  // @ts-expect-error
  gt: number;

  @Field(() => Int, { nullable: true })
  // @ts-expect-error
  lt: number;

  @Field(() => Int, { nullable: true })
  // @ts-expect-error
  gteq: number;

  @Field(() => Int, { nullable: true })
  // @ts-expect-error
  lteq: number;

  @Field(() => [Int], { nullable: true })
  // @ts-expect-error
  in: number[];

  @Field(() => [Int], { nullable: true })
  // @ts-expect-error
  notIn: number[];

  @Field(() => Boolean, { nullable: true })
  // @ts-expect-error
  isNull: boolean;

  @Field(() => Boolean, { nullable: true })
  // @ts-expect-error
  isNotNull: boolean;
}

@ArgsType()
export class FloatArgs {
  @Field(() => Float, { nullable: true })
  // @ts-expect-error
  eq: number;

  @Field(() => Float, { nullable: true })
  // @ts-expect-error
  neq: number;

  @Field(() => Float, { nullable: true })
  // @ts-expect-error
  gt: number;

  @Field(() => Float, { nullable: true })
  // @ts-expect-error
  lt: number;

  @Field(() => Float, { nullable: true })
  // @ts-expect-error
  gteq: number;

  @Field(() => Float, { nullable: true })
  // @ts-expect-error
  lteq: number;

  @Field(() => [Float], { nullable: true })
  // @ts-expect-error
  in: number[];

  @Field(() => [Float], { nullable: true })
  // @ts-expect-error
  notIn: number[];

  @Field(() => Boolean, { nullable: true })
  // @ts-expect-error
  isNull: boolean;

  @Field(() => Boolean, { nullable: true })
  // @ts-expect-error
  isNotNull: boolean;
}

@ArgsType()
export class IDArgs {
  @Field(() => ID, { nullable: true })
  // @ts-expect-error
  eq: string;

  @Field(() => ID, { nullable: true })
  // @ts-expect-error
  neq: string;

  @Field(() => [ID], { nullable: true })
  // @ts-expect-error
  in: string[];

  @Field(() => [ID], { nullable: true })
  // @ts-expect-error
  notIn: string[];

  @Field(() => Boolean, { nullable: true })
  // @ts-expect-error
  isNull: boolean;

  @Field(() => Boolean, { nullable: true })
  // @ts-expect-error
  isNotNull: boolean;
}

@ArgsType()
export class StringArgs {
  @Field(() => String, { nullable: true })
  // @ts-expect-error
  eq: string;

  @Field(() => String, { nullable: true })
  // @ts-expect-error
  neq: string;

  @Field(() => String, { nullable: true })
  // @ts-expect-error
  like: string;

  @Field(() => String, { nullable: true })
  // @ts-expect-error
  notLike: number;

  @Field(() => [String], { nullable: true })
  // @ts-expect-error
  in: string[];

  @Field(() => [String], { nullable: true })
  // @ts-expect-error
  notIn: string[];

  @Field(() => Boolean, { nullable: true })
  // @ts-expect-error
  isNull: boolean;

  @Field(() => Boolean, { nullable: true })
  // @ts-expect-error
  isNotNull: boolean;
}

@ArgsType()
export class BooleanArgs {
  @Field(() => Boolean, { nullable: true })
  // @ts-expect-error
  eq: boolean;

  @Field(() => Boolean, { nullable: true })
  // @ts-expect-error
  neq: boolean;

  @Field(() => [Boolean], { nullable: true })
  // @ts-expect-error
  in: boolean[];

  @Field(() => [Boolean], { nullable: true })
  // @ts-expect-error
  notIn: boolean[];

  @Field(() => Boolean, { nullable: true })
  // @ts-expect-error
  isNull: boolean;

  @Field(() => Boolean, { nullable: true })
  // @ts-expect-error
  isNotNull: boolean;
}
