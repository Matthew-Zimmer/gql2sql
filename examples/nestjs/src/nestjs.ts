import { applyDecorators } from '@nestjs/common';
import { Extensions, Field, FieldOptions, Float, ID, InputType, Int, InterfaceType, InterfaceTypeOptions, ObjectType, ObjectTypeOptions } from '@nestjs/graphql';
import { aliasExtensionName, collectionExtensionName, interfaceExtensionName, relationExtensionName, tableExtensionName, variantExtensionName } from 'gql2sql';

export function Relation(parentId: string, to: string, childId: string): ReturnType<typeof applyDecorators>;
export function Relation(parentId: string, mapping: string, mappingParentId: string, mappingChildId: string, to: string, childId: string): ReturnType<typeof applyDecorators>;
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

export function Table(options?: ObjectTypeOptions) {
  return <F extends Function, Y>(target: F, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => applyDecorators(
    ObjectType(options ?? {}),
    Extensions({
      [tableExtensionName]: { name: target.name }
    })
  )(target, propertyKey, descriptor);
}

export function CollectionField(options?: FieldOptions) {
  return applyDecorators(
    Field({ ...options, middleware: [...options?.middleware ?? [], async (ctx, next) => (await next()) ?? {}] }),
    Extensions({
      [collectionExtensionName]: {}
    }),
  );
}

export function Variant(options?: Omit<InterfaceTypeOptions, 'resolveType'>) {
  return <F extends Function, Y>(target: F, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => applyDecorators(
    InterfaceType({
      resolveType: (x) => {
        return x.kind;
      },
      ...options,
    }),
    Extensions({
      [tableExtensionName]: { name: target.name },
      [interfaceExtensionName]: { tagColumn: "kind" }
    }),
  )(target, propertyKey, descriptor);
}

export function VariantOf<T>(type: () => T, options?: Omit<ObjectTypeOptions, 'implements'>) {
  return <F extends Function, Y>(target: F, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => applyDecorators(
    ObjectType({ implements: type, ...options }),
    Extensions({
      [tableExtensionName]: { name: target.name },
      [variantExtensionName]: { tag: { column: 'kind', value: target.name } },
      [relationExtensionName]: [{ parentId: 'id', to: target.name, childId: 'id' }]
    })
  )(target, propertyKey, descriptor);
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

@InputType()
export class IntArgs {
  @Field(() => Int)
  // @ts-expect-error
  eq: number;

  @Field(() => Int)
  // @ts-expect-error
  neq: number;

  @Field(() => Int)
  // @ts-expect-error
  gt: number;

  @Field(() => Int)
  // @ts-expect-error
  lt: number;

  @Field(() => Int)
  // @ts-expect-error
  gteq: number;

  @Field(() => Int)
  // @ts-expect-error
  lteq: number;

  @Field(() => [Int])
  // @ts-expect-error
  in: number[];

  @Field(() => [Int])
  // @ts-expect-error
  notIn: number[];

  @Field(() => Boolean)
  // @ts-expect-error
  isNull: boolean;

  @Field(() => Boolean)
  // @ts-expect-error
  isNotNull: boolean;
}

@InputType()
export class FloatArgs {
  @Field(() => Float)
  // @ts-expect-error
  eq: number;

  @Field(() => Float)
  // @ts-expect-error
  neq: number;

  @Field(() => Float)
  // @ts-expect-error
  gt: number;

  @Field(() => Float)
  // @ts-expect-error
  lt: number;

  @Field(() => Float)
  // @ts-expect-error
  gteq: number;

  @Field(() => Float)
  // @ts-expect-error
  lteq: number;

  @Field(() => [Float])
  // @ts-expect-error
  in: number[];

  @Field(() => [Float])
  // @ts-expect-error
  notIn: number[];

  @Field(() => Boolean)
  // @ts-expect-error
  isNull: boolean;

  @Field(() => Boolean)
  // @ts-expect-error
  isNotNull: boolean;
}

@InputType()
export class IDArgs {
  @Field(() => ID)
  // @ts-expect-error
  eq: string;

  @Field(() => ID)
  // @ts-expect-error
  neq: string;

  @Field(() => [ID])
  // @ts-expect-error
  in: string[];

  @Field(() => [ID])
  // @ts-expect-error
  notIn: string[];

  @Field(() => Boolean)
  // @ts-expect-error
  isNull: string;

  @Field(() => Boolean)
  // @ts-expect-error
  isNotNull: string;
}

@InputType()
export class StringArgs {
  @Field(() => String)
  // @ts-expect-error
  eq: string;

  @Field(() => String)
  // @ts-expect-error
  neq: string;

  @Field(() => String)
  // @ts-expect-error
  like: string;

  @Field(() => String)
  // @ts-expect-error
  notLike: number;

  @Field(() => [String])
  // @ts-expect-error
  in: string[];

  @Field(() => [String])
  // @ts-expect-error
  notIn: string[];

  @Field(() => Boolean)
  // @ts-expect-error
  isNull: boolean;

  @Field(() => Boolean)
  // @ts-expect-error
  isNotNull: boolean;
}

@InputType()
export class BooleanArgs {
  @Field(() => Boolean)
  // @ts-expect-error
  eq: boolean;

  @Field(() => Boolean)
  // @ts-expect-error
  neq: boolean;

  @Field(() => [Boolean])
  // @ts-expect-error
  in: boolean[];

  @Field(() => [Boolean])
  // @ts-expect-error
  notIn: boolean[];

  @Field(() => Boolean)
  // @ts-expect-error
  isNull: boolean;

  @Field(() => Boolean)
  // @ts-expect-error
  isNotNull: boolean;
}
