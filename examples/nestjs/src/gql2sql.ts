import { inspect } from 'util';
import {
  ArgumentNode,
  BooleanValueNode,
  FieldNode,
  FloatValueNode,
  GraphQLInputType,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLType,
  IntValueNode,
  isEnumType,
  isInterfaceType,
  isListType,
  isNonNullType,
  isObjectType,
  Kind,
  SelectionNode,
  StringValueNode,
  ValueNode,
} from 'graphql';

export const prepareSQLForQuery = <T>(builder: SQL.Builder<T>, info: GraphQLResolveInfo): T => {
  const collection = generateFieldFromQuery(info);
  console.log("const collection =", inspect(collection, false, null));
  const select = Field.generate(collection);
  //console.log("select", inspect(collection, false, null));
  const query = SQL.generate(builder, select);
  return query;
}

export const relationExtensionName = 'relation';
export type RelationExtension = {
  parentId: string;
  childId: string;
  to: string;
}

export const aliasExtensionName = 'alias';
export type AliasExtension = {
  name: string;
}

export const tableExtensionName = 'table';
export type TableExtension = {
  name: string;
}

export type VariantTag = {
  column: string;
  value: string;
}

export const variantExtensionName = 'variant';
export type VariantExtension = {
  tag: VariantTag;
}

export const interfaceExtensionName = 'interface';
export type InterfaceExtension = {
  tagColumn: string;
}

export const collectionExtensionName = 'collection';
export type CollectionHandlerExtension = {
}

export const enumerationExtensionName = 'enumeration';
export type EnumerationHandlerExtension = {
}

type Extensions = {
  [relationExtensionName]: [RelationExtension] | [RelationExtension, RelationExtension];
  [aliasExtensionName]: AliasExtension;
  [tableExtensionName]: TableExtension;
  [variantExtensionName]: VariantExtension;
  [interfaceExtensionName]: InterfaceExtension;
  [collectionExtensionName]: CollectionHandlerExtension;
  [enumerationExtensionName]: EnumerationHandlerExtension;
}

export type Extension<K extends keyof Extensions> = Record<K, Extensions[K]>;

const NEVER = (): never => { throw new Error(`NEVER`); }
const getExtension = <K extends keyof Extensions, T = never>(extensions: any, name: K, defaultValue: () => T = NEVER): Extensions[K] | T => {
  return name in extensions ? extensions[name] : defaultValue();
}

const reduceType = (t: GraphQLType): Exclude<GraphQLType, GraphQLNonNull<any> | GraphQLList<any>> => {
  if (isNonNullType(t)) return reduceType(t.ofType);
  else if (isListType(t)) return reduceType(t.ofType);
  else return t;
}

const reduceToObjectLikeType = (t: GraphQLType): GraphQLObjectType | GraphQLInterfaceType => {
  const rType = reduceType(t);
  if (isObjectType(rType) || isInterfaceType(rType)) return rType;
  else throw new Error(`${t.toString()} did not reduce to object like type`);
}

const reduceToObjectType = (t: GraphQLType): GraphQLObjectType => {
  const rType = reduceType(t);
  if (isObjectType(rType)) return rType;
  else throw new Error(`${t.toString()} did not reduce to object type`);
}

const filterNames = {
  'eq': '=',
  'neq': '!=',
  'lteq': '<=',
  'gteq': '>=',
  'lt': '<',
  'gt': '>',
  'in': 'in',
  'notIn': 'not in',
  'isNull': 'is',
  'isNotNull': 'is not',
  'like': 'like',
  'notLike': 'not like',
  'ilike': 'ilike',
  'notIlike': 'not ilike',
} as const;

const aggNames = [
  'count',
  'max',
  'min',
  'sum',
  'avg',
  'std',
  'stdp',
  'var',
  'varp',
];

const toSqlLike = (x: any, nested?: boolean): any => {
  switch (typeof x) {
    case 'boolean':
    case 'string':
    case 'number':
    case 'undefined':
      return x;
    case 'object':
      if (x === null)
        return 'null';
      else if (Array.isArray(x) && !nested)
        return x.map(x => toSqlLike(x, true));
    default:
      throw new Error(`Cannot convert ${x} to sql like safely`);
  }
}

export const generateFieldFromQuery = (info: GraphQLResolveInfo): Field.CollectionField => {
  const root = info.fieldNodes[0];

  const lookupVariable = (name: string): any => {
    return info.variableValues[name];
  }

  const lookupTypeVariable = (name: string): GraphQLType => {
    return info.schema.getType(name)!;
  }

  const lookupVariableToSqlLike = (name: string): string | undefined => {
    return toSqlLike(lookupVariable(name));
  }

  // RFC should the booleans be combined with an `or` or an `and`?
  const mergeDetail = (d1: Field.DetailField, d2: Field.DetailField): Field.DetailField => {
    return {
      kind: "DetailField",
      alias: d1.alias,
      name: d1.name,
      conditions: d1.conditions,
      sorts: d1.sorts,
      hasOptionalConditions: d1.hasOptionalConditions || d2.hasOptionalConditions,
      skip: d1.skip || d2.skip,
      raw: d1.raw || d2.raw,
    };
  };

  function unique<T>(...groups: T[][]): T[] {
    const res: T[] = [];
    for (const group of groups) {
      for (const g of group) {
        if (!res.includes(g))
          res.push(g);
      }
    }
    return res;
  }

  // ASSUME same kind
  // ASSUME leafs cannot be merged
  const mergeSummary = (s1: Field.SummaryField, s2: Field.SummaryField): Field.SummaryField => {
    if (s1.kind === 'LeafSummaryField') {
      return s1;
    }
    else {
      const s3 = s2 as Field.NodeSummaryField;
      return {
        kind: "NodeSummaryField",
        alias: s1.alias,
        fields: mergeSummaries(s1.fields, s3.fields),
      };
    }
  };

  // ASSUME same childId, parentId, table, tag
  const mergeVariant = (v1: Field.VariantField, v2: Field.VariantField): Field.VariantField => {
    return {
      kind: "VariantField",
      childId: v1.childId,
      parentId: v1.parentId,
      table: v1.table,
      tag: v1.tag,
      relations: mergeRelations(v1.relations, v2.relations),
      details: mergeDetails(v1.details, v2.details),
    };
  };

  const mergeMaybes = <T>(o1: T | undefined, o2: T | undefined, merge: (a: T, b: T) => T): T | undefined => {
    return o1 && o2 ? merge(o1, o2) : (o1 ? o1 : o2);
  }

  const onlyIfSame = <T>(o1: T, o2: T): T => {
    return o1 === o2 ? o1 : (() => { throw new Error(`During merge expected ${o1} to equal ${o2}`) })();
  }

  const mergePagination = (p1?: Field.PaginationField, p2?: Field.PaginationField): Field.PaginationField | undefined => {
    return mergeMaybes(p1, p2, (p1, p2) => ({
      kind: "PaginationField",
      limit: mergeMaybes(p1.limit, p2.limit, onlyIfSame),
      offset: mergeMaybes(p1.offset, p2.offset, onlyIfSame),
    }));
  };

  const mergeDetails = (...groups: Field.DetailField[][]): Field.DetailField[] => {
    const merged: Field.DetailField[] = [];

    for (const details of groups) {
      for (const detail of details) {
        const hit = merged.findIndex(x => x.name === detail.name);
        if (hit === -1) {
          merged.push(detail);
        }
        else {
          merged[hit] = mergeDetail(merged[hit], detail);
        }
      }
    }

    return merged;
  };

  const mergeSummaries = (...groups: Field.SummaryField[][]): Field.SummaryField[] => {
    const merged: Field.SummaryField[] = [];

    for (const summaries of groups) {
      for (const summary of summaries) {
        const hit = merged.findIndex(x => x.alias === summary.alias);
        if (hit === -1) {
          merged.push(summary);
        }
        else {
          merged[hit] = mergeSummary(merged[hit], summary);
        }
      }
    }

    return merged;
  };

  const mergeVariants = (...groups: Field.VariantField[][]): Field.VariantField[] => {
    const merged: Field.VariantField[] = [];

    for (const variants of groups) {
      for (const variant of variants) {
        const hit = merged.findIndex(x => x.table === variant.table);
        if (hit === -1) {
          merged.push(variant);
        }
        else {
          merged[hit] = mergeVariant(merged[hit], variant);
        }
      }
    }

    return merged;
  };

  const mergeRawColumns = (...groups: SQL.ColumnNode[][]): SQL.ColumnNode[] => {
    const merged: SQL.ColumnNode[] = [];

    for (const rawColumns of groups) {
      for (const rawColumn of rawColumns) {
        merged.push(rawColumn);
      }
    }

    return merged;
  };

  // ASSUME name, table, tagColumn are the same
  const mergeCollectionField = (f1: Field.CollectionField, f2: Field.CollectionField): Field.CollectionField => {
    return {
      kind: "Collection",
      name: f1.name,
      skip: f1.skip && f2.skip,
      table: f1.table,
      details: mergeDetails(f1.details, f2.details),
      summaries: mergeSummaries(f1.summaries, f2.summaries),
      relations: mergeRelations(f1.relations, f2.relations),
      variants: mergeVariants(f1.variants, f2.variants),
      rawColumns: mergeRawColumns(f1.rawColumns, f2.rawColumns),
      pagination: mergePagination(f1.pagination, f2.pagination),
      tagColumn: f1.tagColumn
    };
  }

  // ASSUME name, table are the same
  const mergeEntityField = (f1: Field.EntityField, f2: Field.EntityField): Field.EntityField => {
    return {
      kind: "EntityField",
      name: f1.name,
      skip: f1.skip && f2.skip,
      table: f1.table,
      details: mergeDetails(f1.details, f2.details),
      relations: mergeRelations(f1.relations, f2.relations),
      variants: mergeVariants(f1.variants, f2.variants),
    };
  }

  // ASSUME relation info is always the same!
  // ASSUME field kind is always the same!
  const mergeRelation = (r1: Field.RelationField, r2: Field.RelationField): Field.RelationField => {
    const field = r1.field.kind === 'Collection' ? mergeCollectionField(r1.field, r2.field as Field.CollectionField) : mergeEntityField(r1.field, r2.field as Field.EntityField);

    return {
      kind: "RelationField",
      relation: r1.relation,
      field,
    };
  };

  const mergeRelations = (...relationGroups: Field.RelationField[][]): Field.RelationField[] => {
    const x: Field.RelationField[] = [];

    for (const relations of relationGroups) {
      for (const r of relations) {
        const { table } = r.field;
        const matchingIdx = x.findIndex(x => x.field.table === table);
        if (matchingIdx === -1) {
          x.push(r);
        }
        else {
          x[matchingIdx] = mergeRelation(x[matchingIdx], r);
        }
      }
    }

    return x;
  }

  const visitCollectionSelections = (selections: readonly SelectionNode[], type: GraphQLObjectType): [Field.DetailField[], Field.SummaryField[], Field.RelationField[], Field.VariantField[]] => {
    let details: Field.DetailField[] = [];
    let summaries: Field.SummaryField[] = [];
    let detailRelations: Field.RelationField[] = [];
    let summaryRelations: Field.RelationField[] = [];
    let variants: Field.VariantField[] = [];

    for (const selection of selections) {
      switch (selection.kind) {
        case Kind.FIELD: {
          switch (selection.name.value) {
            case 'details':
              [details, detailRelations, variants] = visitDetailSelections(selection.selectionSet?.selections ?? [], reduceToObjectLikeType(type.getFields()['details'].type));
              break;
            case 'summary':
              [summaries, summaryRelations] = visitSummarySelections(selection.selectionSet?.selections ?? [], reduceToObjectType(type.getFields()['summary'].type));
              break;
          }
        }
      }
    }

    const relations = mergeRelations(detailRelations, summaryRelations);

    return [details, summaries, relations, variants];
  };

  const makeRelation = (ext: Extensions['relation']): Field.Relation => {
    return ext.length === 1 ? {
      kind: 'DirectRelation',
      ...ext[0]
    } : {
      kind: 'JunctionRelation',
      toJunction: { kind: 'DirectRelation', ...ext[0] },
      fromJunction: { kind: 'DirectRelation', ...ext[1] },
    };
  }

  const visitDetailSelections = (selections: readonly SelectionNode[], type: GraphQLObjectType | GraphQLInterfaceType): [Field.DetailField[], Field.RelationField[], Field.VariantField[]] => {
    let details: Field.DetailField[] = [];
    let relations: Field.RelationField[] = [];
    let variants: Field.VariantField[] = [];

    for (const selection of selections) {
      switch (selection.kind) {
        case Kind.FIELD: {
          // we still need to look at the arguments and directives
          const name = selection.name.value;
          if (name === "__typename")
            break;
          const field = type.getFields()[name];
          const { extensions, type: fieldType, args } = field;

          if (relationExtensionName in extensions) {
            const relation = getExtension(extensions, relationExtensionName);
            const type = reduceToObjectType(fieldType);
            const field = collectionExtensionName in extensions ? createCollection(selection, type) : createEntity(selection, type, relation[relation.length - 1].to);
            relations.push({
              kind: 'RelationField',
              relation: makeRelation(relation),
              field,
            });
          }
          else {
            details.push(createDetailField(selection, type));
          }
        }
          break;
        case Kind.INLINE_FRAGMENT: {
          if (selection.typeCondition === undefined)
            throw new Error(`Error: unexpected inline fragment without type condition`);
          const typeName = selection.typeCondition.name.value;
          const type = reduceToObjectLikeType(lookupTypeVariable(typeName));

          const { extensions } = type;

          const [relation] = getExtension(extensions, relationExtensionName, null as any);
          const { tag } = getExtension(extensions, variantExtensionName, null as any);
          const [details, relations] = visitDetailSelections(selection.selectionSet.selections, type);

          variants.push({
            kind: "VariantField",
            table: relation.to,
            parentId: relation.parentId,
            childId: relation.childId,
            details,
            relations,
            tag,
          });
          break;
        }
      }
    }

    return [details, relations, variants];
  };

  let implicitAggCount = 0;

  const makeAgg = (func: Field.AggregationFunc, dbName: string, apiName: string): Field.Aggregation => {
    if (dbName === 'total') {
      return {
        kind: "Aggregation",
        func,
        name: "1",
        raw: true,
        alias: apiName,
      };
    }

    return {
      kind: "Aggregation",
      func,
      name: dbName,
      alias: apiName,
      raw: false,
    };
  };

  type EnumSelector = {
    col?: string,
    value?: string,
  }

  const visitSummarySelections = (selections: readonly SelectionNode[], type: GraphQLObjectType): [Field.SummaryField[], Field.RelationField[]] => {
    const imp = (
      selections: readonly SelectionNode[],
      type: GraphQLObjectType,
      col: string,
      func: Field.AggregationFunc | undefined,
      enumState: EnumSelector | undefined
    ): [Field.SummaryField[], Field.RelationField[], Field.Aggregation[]] => {
      const summaries: Field.SummaryField[] = [];
      const relations: Field.RelationField[] = [];
      const aggs: Field.Aggregation[] = [];

      for (const selection of selections) {
        switch (selection.kind) {
          case Kind.FIELD: {
            const name = selection.name.value;
            if (name === '__typename') break;
            const { extensions, type: fieldType } = type.getFields()[name];
            const ty = reduceType(fieldType);
            const isRelation = relationExtensionName in extensions;
            const isCollection = collectionExtensionName in extensions;
            const isEnumeration = enumerationExtensionName in extensions;
            const isAggregationFunc = aggNames.includes(name);
            const { name: dbName } = getExtension(extensions, aliasExtensionName, () => ({ name }));

            if (isObjectType(ty)) {
              const subSelections = selection.selectionSet?.selections ?? [];
              const { extensions: typeExtensions } = ty;

              if (isRelation) {
                const relation = getExtension(extensions, relationExtensionName);
                if (isCollection) {
                  const table = getExtension(typeExtensions, tableExtensionName);
                  const [a, b, c] = imp(subSelections, ty, col, func, enumState);
                  summaries.push({
                    kind: "NodeSummaryField",
                    alias: name,
                    fields: a,
                  });
                  relations.push({
                    kind: "RelationField",
                    relation: makeRelation(relation),
                    field: {
                      kind: "Collection",
                      name: "", // ???????
                      table: table.name,
                      skip: true,
                      details: [],
                      relations: b,
                      summaries: [],
                      variants: [],
                      rawColumns: c.map<SQL.ColumnNode>(x => ({
                        kind: "ColumnNode",
                        alias: x.alias,
                        expr: {
                          kind: "ApplicationExpressionNode",
                          func: {
                            kind: "RawExpressionNode",
                            value: Field.translateAggregationFuncToSql(x.func),
                          },
                          args: [x.raw ? {
                            kind: "RawExpressionNode",
                            value: x.name
                          } : {
                            kind: "IdentifierExpressionNode",
                            name: x.name
                          }]
                        }
                      })),
                    },
                  });
                }
                else {
                  const table = getExtension(typeExtensions, tableExtensionName);
                  const [a, b, c] = imp(subSelections, ty, col, func, enumState);
                  summaries.push({
                    kind: "NodeSummaryField",
                    alias: name,
                    fields: a,
                  });
                  relations.push({
                    kind: "RelationField",
                    relation: makeRelation(relation),
                    field: {
                      kind: "EntityField",
                      name: "", // ???????
                      table: table.name,
                      skip: true,
                      details: [],
                      relations: b,
                      variants: [],
                    },
                  });
                  aggs.push(...c);
                }
              }
              else if (isEnumeration) {
                const [subSummaries, subRelations, subAggs] = imp(subSelections, ty, col, func, {
                  col: name
                });
                relations.push(...subRelations);
                aggs.push(...subAggs);
                summaries.push({
                  kind: "NodeSummaryField",
                  alias: name,
                  fields: subSummaries,
                });
              }
              else if (isAggregationFunc) {
                let colName = name;
                if (func !== undefined) {
                  colName = `__agg${implicitAggCount++}`;
                  aggs.push(makeAgg(name as Field.AggregationFunc, col, colName));
                }
                const [subSummaries, subRelations, subAggs] = imp(selection.selectionSet?.selections ?? [], ty, col, name as Field.AggregationFunc, enumState);
                relations.push(...subRelations);
                aggs.push(...subAggs);
                summaries.push({
                  kind: "NodeSummaryField",
                  alias: name,
                  fields: subSummaries,
                });
              }
              else {
                const nextEnumState: EnumSelector | undefined = enumState === undefined ? undefined : enumState.value !== undefined ? enumState : {
                  ...enumState,
                  value: name,
                };
                const [subSummaries, subRelations, subAggs] = imp(subSelections, ty, dbName, func, nextEnumState);
                summaries.push({
                  kind: "NodeSummaryField",
                  alias: name,
                  fields: subSummaries,
                });
                relations.push(...subRelations);
                aggs.push(...subAggs);
              }
            }
            else {
              // base case
              const over = enumState && enumState.col && enumState.value ? {
                col: enumState.col,
                value: enumState.value,
              } : undefined;

              // there has been an aggregation before us
              // we need to generate an implicit column
              if (func !== undefined) {
                const colName = `__agg${implicitAggCount++}`;
                summaries.push({
                  kind: "LeafSummaryField",
                  alias: name,
                  aggregation: makeAgg(func, colName, colName),
                  over,
                });
                aggs.push(makeAgg(name as Field.AggregationFunc, col, colName));
              }
              // there has not been an aggregation before us
              // safe to aggregate here
              else {
                summaries.push({
                  kind: "LeafSummaryField",
                  alias: name,
                  aggregation: makeAgg(name as Field.AggregationFunc, col, col),
                  over,
                });
              }
            }
          }
            break;
        }
      }

      return [summaries, relations, aggs];
    }

    const [summaries, relations] = imp(selections, type, '', undefined, undefined);
    return [summaries, relations];
  };

  const paginationArgs = (args: readonly ArgumentNode[]): Field.PaginationField | undefined => {
    const lookupInt = (x?: ValueNode): number | undefined => {
      if (!x) return undefined;
      switch (x.kind) {
        case Kind.INT:
          return Number(x.value);
        case Kind.VARIABLE: {
          const val = lookupVariable(x.name.value)
          return typeof val === 'number' && Number.isInteger(val) ? val : undefined;
        }
      }
    }
    const offset = lookupInt(args.find(x => x.name.value === 'offset')?.value);
    const limit = lookupInt(args.find(x => x.name.value === 'limit')?.value);

    return offset === undefined && limit === undefined ? undefined : { kind: 'PaginationField', limit, offset };
  };

  const isSkipped = (x: SelectionNode): boolean => {
    const directives = x.directives ?? [];
    const skipDirective = directives.find(x => x.name.value === 'skip');
    if (!skipDirective) return false;
    const args = skipDirective.arguments ?? [];
    const ifArg = args.find(x => x.name.value === 'if');
    if (!ifArg) return false;
    return ifArg.value.kind === Kind.BOOLEAN && ifArg.value.value;
  };

  const createCollection = (field: FieldNode, type: GraphQLObjectType): Field.CollectionField => {
    const [details, summaries, relations, variants] = visitCollectionSelections(field.selectionSet?.selections ?? [], type);

    const extensions = reduceToObjectLikeType(type.getFields()['details'].type).extensions;
    if (!(tableExtensionName in extensions))
      throw new Error(`Collection type: ${type.name}'s details does not have the associated table extension, please fix`);

    const tableExtension = extensions[tableExtensionName] as TableExtension;
    const { tagColumn } = getExtension(extensions, interfaceExtensionName, () => ({ tagColumn: undefined }));

    const pagination = paginationArgs(field.arguments ?? []);
    const skip = isSkipped(field);

    return {
      kind: 'Collection',
      skip,
      name: field.name.value,
      table: tableExtension.name,
      details,
      summaries,
      relations,
      variants,
      pagination,
      tagColumn,
      rawColumns: [],
    };
  };

  const createEntity = (field: FieldNode, type: GraphQLObjectType, table: string): Field.EntityField => {
    const [details, relations, variants] = visitDetailSelections(field.selectionSet?.selections ?? [], type);

    const skip = isSkipped(field);

    return {
      kind: 'EntityField',
      skip,
      name: field.name.value,
      table,
      details,
      relations,
      variants,
    };
  };

  const resolveValue = (value: ValueNode): any => {
    switch (value.kind) {
      case Kind.INT:
      case Kind.BOOLEAN:
      case Kind.FLOAT:
      case Kind.STRING:
        return value.value;
      case Kind.LIST:
        return value.values.map(resolveValue);
      case Kind.VARIABLE:
        return lookupVariable(value.name.value);
      case Kind.ENUM:
        return value.value;
    }
  }

  const createDetailField = (x: FieldNode, type: GraphQLObjectType | GraphQLInterfaceType): Field.DetailField => {
    const name = x.name.value;
    const { extensions, args } = type.getFields()[name];
    const [sorts, conditions] = sortAndFilterConditionsFromArgs(x.arguments ?? [], args.map(x => x.type));
    const skip = isSkipped(x);

    return {
      kind: 'DetailField',
      alias: name,
      name: aliasExtensionName in extensions ? (extensions[aliasExtensionName] as AliasExtension).name : name,
      skip,
      conditions,
      sorts,
      hasOptionalConditions: x.arguments?.some(x => x.name.value === "opt" && resolveValue(x.value) === true) ?? false,
    };
  }

  const sortAndFilterConditionsFromArgs = (args: readonly ArgumentNode[], argsTypes: GraphQLInputType[]): [Field.FieldSortCondition[], Field.FieldFilterCondition[]] => {
    const sorts: Field.FieldSortCondition[] = [];
    const filters: Field.FieldFilterCondition[] = [];

    for (const [i, arg] of args.entries()) {
      const type = argsTypes[i];
      const name = arg.name.value;
      if (name === 'sort') {
        let value: string | undefined = undefined;

        switch (arg.value.kind) {
          case Kind.ENUM:
            value = arg.value.value;
            break;
          case Kind.VARIABLE:
            value = lookupVariableToSqlLike(arg.value.name.value);
            break;
        }

        if (value && ['asc', 'desc'].includes(value)) {
          sorts.push({
            kind: 'FieldSortCondition',
            condition: value as SQL.SortOp,
          });
        }
      }
      else if (name in filterNames) {
        let value: any | undefined = resolveValue(arg.value);

        if (isEnumType(type)) {
          const { name } = type;
          if (Array.isArray(value)) {
            value = value.map(x => new SQL.CastedParameter(x, name));
          }
          else if (value !== undefined) {
            value = new SQL.CastedParameter(value, name);
          }
        }

        if (value !== null && value !== undefined)
          filters.push({
            kind: 'FieldFilterCondition',
            condition: filterNames[name as keyof typeof filterNames],
            value,
          });
      }
      else if (name === "isNull") {
        let value: any | undefined = undefined;

        switch (arg.value.kind) {
          case Kind.BOOLEAN:
            value = arg.value.value;
            break;
          case Kind.VARIABLE:
            value = lookupVariable(arg.value.name.value);
            break;
        }

        if (value !== null && value !== undefined)
          filters.push({
            kind: 'FieldFilterCondition',
            condition: value ? 'is' : 'is not',
            value: 'null'
          });
      }
    }

    return [sorts, filters];
  };

  const rootCollection = createCollection(root, reduceToObjectType(info.returnType));

  return {
    ...rootCollection,
    name: 'root',
  };
};

export namespace Field {
  export type CollectionField = {
    kind: "Collection";
    skip: boolean;
    name: string;
    table: string;
    summaries: SummaryField[];
    // details are for columns on this table
    details: DetailField[];
    // relations are for other collections
    relations: RelationField[];
    // variants are for columns of variant data
    variants: VariantField[];
    pagination?: PaginationField;
    tagColumn?: string;
    rawColumns: SQL.ColumnNode[];
  }

  export type EntityField = {
    kind: "EntityField";
    skip: boolean;
    name: string;
    table: string;
    details: DetailField[];
    relations: RelationField[];
    variants: VariantField[];
  }

  export type VariantField = {
    kind: "VariantField";
    table: string;
    tag: VariantTag;
    parentId: string;
    childId: string;
    details: DetailField[];
    relations: RelationField[];
  }

  export type SummaryField =
    | NodeSummaryField
    | LeafSummaryField

  export type NodeSummaryField = {
    kind: "NodeSummaryField",
    alias: string,
    fields: SummaryField[],
  }

  export type LeafSummaryField = {
    kind: "LeafSummaryField",
    alias: string,
    aggregation: Aggregation,
    over?: {
      col: string,
      value: string,
    },
  }

  export type AggregationFunc =
    | 'sum'
    | 'count'
    | 'max'
    | 'min'
    | 'avg'
    | 'std'
    | 'stdp'
    | 'var'
    | 'varp'

  export type Aggregation = {
    kind: "Aggregation",
    func: AggregationFunc,
    name: string,
    alias?: string,
    raw: boolean,
  }

  export type DetailField = {
    kind: "DetailField";
    skip: boolean;
    name: string;
    alias: string;
    conditions: FieldFilterCondition[];
    hasOptionalConditions: boolean;
    sorts: FieldSortCondition[];
    raw?: boolean;
  }

  export type FieldFilterCondition = {
    kind: "FieldFilterCondition";
    condition: SQL.WhereOp;
    value: any;
  }

  export type FieldSortCondition = {
    kind: "FieldSortCondition";
    condition: SQL.SortOp;
  }

  export type RelationField = {
    kind: "RelationField";
    relation: Relation;
    field: CollectionField | EntityField;
  }

  export type Relation =
    | DirectRelation
    | JunctionRelation

  export type DirectRelation = {
    kind: "DirectRelation";
    to: string;
    parentId: string;
    childId: string;
  }

  export type JunctionRelation = {
    kind: "JunctionRelation";
    toJunction: DirectRelation;
    fromJunction: DirectRelation;
  }

  export type PaginationField = {
    kind: "PaginationField";
    offset?: number;
    limit?: number;
  }

  type CollectionMetaInfo = {
    hasCascadingFilters: boolean;
    hasPagination: boolean;
  }

  type VariantMetaInfo = {
    tag: VariantTag;
    table: string;
    join: SQL.JoinNode;
    details: SQL.ExpressionNode[];
    relations: SQL.JoinNode[];
    conditions: SQL.WhereNode[];
    sorts: SQL.SortNode[];
  }

  function mergeWhereConditions(conds: SQL.WhereNode[], op: SQL.WhereBinaryOp): SQL.WhereNode {
    return conds.reduce((p, c) => ({ kind: "WhereBinaryNode", left: p, op, right: c }));
  }

  function hasCascadingFilters(fields: DetailField[]): boolean {
    return fields.map(x => x.conditions.length > 0 && !x.hasOptionalConditions).some(x => x);
  }

  export const translateAggregationFuncToSql = (agg: Field.AggregationFunc): string => {
    switch (agg) {
      case 'sum':
      case 'count':
      case 'max':
      case 'min':
      case 'avg':
        return agg;
      case 'std':
        return 'stddev_samp';
      case 'stdp':
        return 'stddev_pop';
      case 'var':
        return 'var_samp';
      case 'varp':
        return 'var_pop';
    }
  }

  /**
   * TODO!! need to do something with the summary filter and sort arguments
   */
  export function generate(field: CollectionField): SQL.SelectNode {
    let tableAliasCount = 0;
    const makeTableAlias = () => `t${tableAliasCount++}`;

    const generateCollectionField = (x: CollectionField): [SQL.SelectNode, string, CollectionMetaInfo] => {
      const rawTable = makeTableAlias();
      const table = makeTableAlias();

      const [details, detailsWhereNodes, detailsSortNodes] = generateDetailFields(x.details, rawTable, table);
      const summary = generateSummaryFields(x.summaries, table);
      const relations = generateRelationFields(x.relations, rawTable);
      const variants = generateVariantFields(x.variants, rawTable, table);

      const tables = {
        baseTable: table,
        innerTable: rawTable,
      };

      const columns = createCollectionColumns(x, details, summary, relations, variants, tables);
      const joins = createJoins(relations, variants);
      const conditions = createWhereConditions(detailsWhereNodes, variants, tables);

      const node: SQL.SelectNode = {
        kind: 'SelectNode',
        columns,
        from: {
          kind: 'FromSelectNode',
          alias: table,
          select: {
            kind: 'SelectNode',
            from: {
              kind: 'FromTableNode',
              table: x.table,
              alias: rawTable
            },
            columns: [],
            joins,
            conditions,
            sorts: detailsSortNodes,
            pagination: !x.pagination ? undefined : {
              kind: 'PaginationNode',
              limit: x.pagination.limit,
              offset: x.pagination.offset,
            },
          },
        },
        joins: [],
        sorts: [],
      };

      const info: CollectionMetaInfo = {
        hasCascadingFilters: hasCascadingFilters(x.details),
        hasPagination: x.pagination !== undefined,
      };

      return [node, table, info];
    };

    const generateEntityField = (x: EntityField): [SQL.SelectNode, string, CollectionMetaInfo] => {
      const rawTable = makeTableAlias();
      const table = makeTableAlias();

      const [details, detailsWhereNodes, detailsSortNodes] = generateDetailFields(x.details, rawTable, table);
      const relations = generateRelationFields(x.relations, rawTable);
      const variants = generateVariantFields(x.variants, rawTable, table);

      const tables = {
        baseTable: table,
        innerTable: rawTable,
      };

      const columns = createEntityColumns(x, details, relations, variants, tables);
      const joins = createJoins(relations, variants);
      const conditions = createWhereConditions(detailsWhereNodes, variants, tables);

      const node: SQL.SelectNode = {
        kind: 'SelectNode',
        columns,
        from: {
          kind: 'FromSelectNode',
          alias: table,
          select: {
            kind: 'SelectNode',
            from: {
              kind: 'FromTableNode',
              table: x.table,
              alias: rawTable
            },
            columns: [],
            joins,
            conditions,
            sorts: detailsSortNodes,
          },
        },
        joins: [],
        sorts: [],
      };

      const info: CollectionMetaInfo = {
        hasCascadingFilters: hasCascadingFilters(x.details),
        hasPagination: false,
      };

      return [node, table, info];
    };

    const generateObjectField = (x: EntityField | CollectionField): [SQL.SelectNode, string, CollectionMetaInfo] => {
      switch (x.kind) {
        case "Collection":
          return generateCollectionField(x);
        case "EntityField":
          return generateEntityField(x);
      }
    };

    const createCollectionColumns = (collection: CollectionField, details: SQL.ExpressionNode[], summary: SQL.ExpressionNode, relations: SQL.JoinNode[], variants: VariantMetaInfo[], tables: { baseTable: string }): SQL.ColumnNode[] => {
      const wrap = (args: SQL.ExpressionNode[]): SQL.ExpressionNode => {
        return {
          kind: 'ApplicationExpressionNode',
          func: {
            kind: 'RawExpressionNode',
            value: 'json_build_object'
          },
          args
        };
      };

      const wrapVariant = (args: SQL.ExpressionNode[], variant: VariantMetaInfo): SQL.ExpressionNode => {
        return wrap([...args, ...variant.details]);
      }

      const hasDetails = details.length > 0 || relations.length > 0 || variants.length > 0;
      const hasSummary = collection.summaries.length > 0;
      const needsDetailTag = collection.tagColumn !== undefined && !collection.details.some(x => x.name === collection.tagColumn);

      const nonVariantDetails: SQL.ExpressionNode[] = [
        ...details,
        ...!needsDetailTag ? [] : [{ kind: 'StringExpressionNode' as const, value: collection.tagColumn! }, SQL.simpleColumnNode(tables.baseTable, collection.tagColumn!).expr],
        ...collection.relations.filter(x => !x.field.skip).flatMap<SQL.ExpressionNode>(r => [
          { kind: 'StringExpressionNode', value: r.field.name },
          { kind: 'DotExpressionNode', left: { kind: 'IdentifierExpressionNode', name: tables.baseTable }, right: { kind: 'IdentifierExpressionNode', name: r.field.name } }
        ]),
      ];

      const fullDetails: SQL.ExpressionNode = {
        kind: "ApplicationExpressionNode",
        func: {
          kind: "RawExpressionNode",
          value: "coalesce"
        },
        args: [
          {
            kind: 'ApplicationExpressionNode',
            func: {
              kind: 'RawExpressionNode',
              value: 'array_agg'
            },
            args: [
              variants.length === 0 ? wrap(nonVariantDetails) :
                variants.length === 1 ? wrapVariant(nonVariantDetails, variants[0]) :
                  {
                    kind: "CaseExpressionNode",
                    whens: variants.map<SQL.WhenExpressionNode>(variant => ({
                      kind: "WhenExpressionNode",
                      cond: {
                        kind: "BinaryOpExpressionNode",
                        op: "=",
                        left: {
                          kind: "DotExpressionNode",
                          left: {
                            kind: "IdentifierExpressionNode",
                            name: tables.baseTable,
                          },
                          right: {
                            kind: "IdentifierExpressionNode",
                            name: variant.tag.column,
                          },
                        },
                        right: {
                          kind: "StringExpressionNode",
                          value: variant.tag.value
                        },
                      },
                      value: wrapVariant(nonVariantDetails, variant),
                    })),
                  }
            ]
          },
          {
            kind: "RawExpressionNode",
            value: "array []::json[]"
          }
        ]
      };

      return collection.skip ? collection.rawColumns : [...collection.rawColumns, {
        kind: 'ColumnNode',
        expr: {
          kind: 'ApplicationExpressionNode',
          func: {
            kind: 'RawExpressionNode',
            value: 'json_build_object'
          },
          args: [
            ...(!hasDetails ? [] : [{ kind: 'StringExpressionNode' as const, value: 'details' }, fullDetails]),
            ...(!hasSummary ? [] : [{ kind: 'StringExpressionNode' as const, value: 'summary' }, summary]),
          ]
        },
        alias: collection.name,
      }];
    }

    const createEntityColumns = (entity: EntityField, details: SQL.ExpressionNode[], relations: SQL.JoinNode[], variants: VariantMetaInfo[], tables: { baseTable: string }): SQL.ColumnNode[] => {
      const wrap = (args: SQL.ExpressionNode[]): SQL.ExpressionNode => {
        return {
          kind: 'ApplicationExpressionNode',
          func: {
            kind: 'RawExpressionNode',
            value: 'json_build_object'
          },
          args
        };
      };

      const wrapVariant = (args: SQL.ExpressionNode[], variant: VariantMetaInfo): SQL.ExpressionNode => {
        return wrap([...args, ...variant.details]);
      }

      const nonVariantDetails: SQL.ExpressionNode[] = [
        ...details,
        ...entity.relations.filter(x => !x.field.skip).flatMap<SQL.ExpressionNode>(r => [
          { kind: 'StringExpressionNode', value: r.field.name },
          { kind: 'DotExpressionNode', left: { kind: 'IdentifierExpressionNode', name: tables.baseTable }, right: { kind: 'IdentifierExpressionNode', name: r.field.name } }
        ]),
      ];

      const fullDetails: SQL.ExpressionNode =
        variants.length === 0 ? wrap(nonVariantDetails) :
          variants.length === 1 ? wrapVariant(nonVariantDetails, variants[0]) :
            {
              kind: "CaseExpressionNode",
              whens: variants.map<SQL.WhenExpressionNode>(variant => ({
                kind: "WhenExpressionNode",
                cond: {
                  kind: "BinaryOpExpressionNode",
                  op: "=",
                  left: {
                    kind: "DotExpressionNode",
                    left: {
                      kind: "IdentifierExpressionNode",
                      name: tables.baseTable,
                    },
                    right: {
                      kind: "IdentifierExpressionNode",
                      name: variant.tag.column,
                    },
                  },
                  right: {
                    kind: "StringExpressionNode",
                    value: variant.tag.value
                  },
                },
                value: wrapVariant(nonVariantDetails, variant),
              })),
            };

      return entity.skip ? [] : [{
        kind: 'ColumnNode',
        expr: fullDetails,
        alias: entity.name,
      }];
    }

    const createJoins = (relations: SQL.JoinNode[], variants: VariantMetaInfo[]): SQL.JoinNode[] => {
      return relations.concat(...variants.flatMap(x => [x.join, x.relations]));
    }

    const createWhereConditions = (base: SQL.WhereNode[], variants: VariantMetaInfo[], tables: { baseTable: string, innerTable: string }): SQL.WhereNode | undefined => {
      const tagCond = (v: VariantMetaInfo): SQL.WhereNode => ({
        kind: "WhereCompareNode",
        column: {
          kind: "ColumnNode",
          expr: {
            kind: "DotExpressionNode",
            left: {
              kind: "IdentifierExpressionNode",
              name: tables.innerTable,
            },
            right: {
              kind: "IdentifierExpressionNode",
              name: v.tag.column,
            }
          }
        },
        op: "=",
        value: new SQL.TrustedInput(`'${v.tag.value}'`),
      });

      const variantConds = (v: VariantMetaInfo): SQL.WhereNode[] => [tagCond(v), ...v.conditions];

      const conds = (
        variants.length === 0 ? base :
          variants.length === 1 ? [...base, ...variantConds(variants[0])] :
            [
              ...base,
              mergeWhereConditions(variants.map<SQL.WhereNode>(v =>
                mergeWhereConditions(variantConds(v), 'and')
              ), 'or')
            ]
      );

      return conds.length === 0 ? undefined : mergeWhereConditions(conds, 'and');
    }

    const generateDetailFields = (x: DetailField[], rawTable: string, table: string): [SQL.ExpressionNode[], SQL.WhereNode[], SQL.SortNode[]] => {
      const whereNodes: SQL.WhereNode[] = [];
      const sortNodes: SQL.SortNode[] = [];
      const args: SQL.ExpressionNode[] = [];

      for (const f of x) {
        const [cols, wNodes, sNodes] = generateDetailField(f, rawTable, table);
        args.push(...cols);
        whereNodes.push(...wNodes);
        sortNodes.push(...sNodes);
      }

      return [args, whereNodes, sortNodes];
    };

    const generateDetailField = (x: DetailField, rawTable: string, table: string): [[SQL.StringExpressionNode, SQL.ExpressionNode] | [], SQL.WhereNode[], SQL.SortNode[]] => {
      const subColumnExpr = SQL.simpleColumnNode(rawTable, x.name).expr;
      const selectColumnExpr: SQL.ExpressionNode = x.raw ? { kind: 'RawExpressionNode', value: x.name } : SQL.simpleColumnNode(table, x.name).expr;

      const whereNodes = x.conditions.map(c => generateFieldFilterCondition(c, subColumnExpr));
      const sortNodes = x.sorts.map(c => generateFieldSortCondition(c, subColumnExpr));

      return [
        x.skip ? [] : [
          { kind: 'StringExpressionNode', value: x.alias },
          selectColumnExpr,
        ],
        whereNodes,
        sortNodes
      ];
    };

    const generateSummaryFields = (x: SummaryField[], table: string): SQL.ExpressionNode => {
      const args = x.flatMap(f => generateSummaryField(f, table, table));

      return {
        kind: 'ApplicationExpressionNode',
        func: {
          kind: 'RawExpressionNode',
          value: 'json_build_object'
        },
        args
      };
    };

    const generateSummaryField = (x: SummaryField, rawTable: string, table: string): [SQL.StringExpressionNode, SQL.ApplicationExpressionNode] => {
      switch (x.kind) {
        case 'NodeSummaryField': return generateNodeSummaryField(x, rawTable, table);
        case 'LeafSummaryField': return generateLeafSummaryField(x, rawTable, table);
      }
    };

    const generateNodeSummaryField = (f: NodeSummaryField, rawTable: string, table: string): [SQL.StringExpressionNode, SQL.ApplicationExpressionNode] => {
      return [
        { kind: 'StringExpressionNode', value: f.alias },
        {
          kind: 'ApplicationExpressionNode',
          func: {
            kind: 'RawExpressionNode',
            value: 'json_build_object',
          },
          args: f.fields.flatMap(x => generateSummaryField(x, rawTable, table))
        }
      ];
    };

    const generateLeafSummaryField = (f: LeafSummaryField, rawTable: string, table: string): [SQL.StringExpressionNode, SQL.ApplicationExpressionNode] => {
      const agg: SQL.ExpressionNode = !f.aggregation.raw ? SQL.simpleColumnNode(table, f.aggregation.name).expr : {
        kind: "RawExpressionNode",
        value: f.aggregation.name
      };
      const args: SQL.ExpressionNode[] = f.over === undefined ? [agg] : [
        {
          kind: "CaseExpressionNode",
          whens: [{
            kind: "WhenExpressionNode",
            cond: {
              kind: "BinaryOpExpressionNode",
              left: SQL.simpleColumnNode(table, f.over.col).expr,
              op: '=',
              right: {
                kind: "StringExpressionNode",
                value: f.over.value,
              }
            },
            value: agg,
          }]
        }
      ];

      return [
        {
          kind: "StringExpressionNode",
          value: f.alias,
        },
        {
          kind: 'ApplicationExpressionNode',
          func: {
            kind: "RawExpressionNode",
            value: translateAggregationFuncToSql(f.aggregation.func)
          },
          args,
        },
      ];
    };

    const generateRelationFields = (x: RelationField[], table: string): SQL.JoinNode[] => {
      return x.map(f => generateRelationField(f, table));
    };

    const generateRelationField = (x: RelationField, table: string): SQL.JoinNode => {
      const [collection, collectionTable, info] = generateObjectField(x.field);

      const needsAgg = x.field.kind === "Collection";

      const groupColumName = `${collectionTable}__gc`;
      const rowNumberName = `${collectionTable}__rn`;
      const rowNumberColumn = SQL.simpleColumnNode(collectionTable, rowNumberName);
      const fromSelectNode = collection.from as SQL.FromSelectNode;

      switch (x.relation.kind) {
        case 'DirectRelation': {
          const joinTable = makeTableAlias();
          const paginatedFrom: SQL.FromSelectNode | {} = !info.hasPagination ? {} : {
            from: {
              ...fromSelectNode,
              select: {
                ...fromSelectNode.select,
                columns: [{
                  kind: 'ColumnNode',
                  expr: { kind: 'RawExpressionNode', value: '*' }
                }, {
                  kind: 'ColumnNode',
                  expr: { kind: 'RawExpressionNode', value: `row_number() over (partition by "${fromSelectNode.select.from.alias}".${x.relation.childId})` }, // might need any order by here as well
                  alias: rowNumberName,
                }],
                pagination: undefined,
              }
            },
          };

          const conditions: SQL.WhereNode[] = [
            ...collection.conditions === undefined ? [] : [collection.conditions],
            ...fromSelectNode.select.pagination?.limit === undefined ? [] : [{
              kind: 'WhereCompareNode' as const,
              column: rowNumberColumn,
              op: '<=' as const,
              value: fromSelectNode.select.pagination?.limit! + (fromSelectNode.select.pagination?.offset ?? 0),
            }],
            ...fromSelectNode.select.pagination?.offset === undefined ? [] : [{
              kind: 'WhereCompareNode' as const,
              column: rowNumberColumn,
              op: '>' as const,
              value: fromSelectNode.select.pagination?.offset!,
            }],
          ];

          const needsConditions = conditions.length !== 0;

          const groupedCollection: SQL.SelectNode = {
            ...collection,
            ...paginatedFrom,
            groupBy: needsAgg ? {
              kind: 'GroupByNode',
              column: { kind: 'ColumnNode', expr: { kind: 'IdentifierExpressionNode', name: groupColumName } },
            } : undefined,
            columns: [
              SQL.simpleColumnNode(collectionTable, x.relation.childId, groupColumName),
              ...collection.columns,
            ],
            ...!needsConditions ? {} : {
              conditions: mergeWhereConditions(conditions, 'and'),
            },
          };
          return {
            kind: 'DirectJoinNode',
            op: info.hasCascadingFilters ? 'inner' : 'left',
            parentId: SQL.simpleColumnNode(table, x.relation.parentId),
            childId: SQL.simpleColumnNode(joinTable, groupColumName),
            from: { kind: 'FromSelectNode', select: groupedCollection, alias: joinTable },
          };
        }
        case 'JunctionRelation': {
          const junctionTable = makeTableAlias();
          const joinTable = makeTableAlias();
          const groupedCollection: SQL.SelectNode = {
            ...collection,
            groupBy: needsAgg ? {
              kind: 'GroupByNode',
              column: { kind: 'ColumnNode', expr: { kind: 'IdentifierExpressionNode', name: groupColumName } },
            } : undefined,
            columns: [
              SQL.simpleColumnNode(junctionTable, x.relation.toJunction.childId, groupColumName),
              ...collection.columns,
            ],
            joins: [
              ...collection.joins,
              {
                kind: 'DirectJoinNode',
                op: 'inner',
                parentId: SQL.simpleColumnNode(junctionTable, x.relation.fromJunction.parentId),
                childId: SQL.simpleColumnNode(collectionTable, x.relation.fromJunction.childId),
                from: { kind: 'FromTableNode', table: x.relation.toJunction.to, alias: junctionTable },
              }
            ]
          };
          return {
            kind: 'DirectJoinNode',
            op: info.hasCascadingFilters ? 'inner' : 'left',
            parentId: SQL.simpleColumnNode(table, x.relation.toJunction.parentId),
            childId: SQL.simpleColumnNode(joinTable, groupColumName),
            from: { kind: 'FromSelectNode', select: groupedCollection, alias: joinTable },
          };
        }
      }
    };

    const generateVariantFields = (x: VariantField[], rawTable: string, table: string): VariantMetaInfo[] => {
      return x.map(x => generateVariantField(x, rawTable, table));
    };

    const generateVariantField = (x: VariantField, rawTable: string, table: string): VariantMetaInfo => {
      const variantTable = makeTableAlias();
      const innerVariantTable = makeTableAlias();

      const [details, conditions, sorts] = generateDetailFields(x.details, variantTable, table);

      const childIdAlias = `__${innerVariantTable}_child_id`
      const hasChildId = x.details.some(d => d.name === x.childId);
      const subColumns = x.details.map(d =>
        SQL.simpleColumnNode(innerVariantTable, d.name, d.name === x.childId ? childIdAlias : undefined)
      ).concat(!hasChildId ? [SQL.simpleColumnNode(innerVariantTable, x.childId, childIdAlias)] : []);

      return {
        table: table,
        join: {
          kind: "DirectJoinNode",
          op: "left",
          parentId: SQL.simpleColumnNode(rawTable, x.parentId),
          childId: SQL.simpleColumnNode(variantTable, childIdAlias),
          from: {
            kind: "FromSelectNode",
            alias: variantTable,
            select: {
              kind: "SelectNode",
              columns: subColumns,
              joins: [],
              sorts: [],
              from: {
                kind: "FromTableNode",
                table: x.table,
                alias: innerVariantTable,
              }
            }
          },
        },
        tag: x.tag,
        details,
        relations: [], // TODO! implement later
        conditions,
        sorts,
      };
    };

    const generateFieldFilterCondition = (x: FieldFilterCondition, d: SQL.ExpressionNode): SQL.WhereNode => {
      return {
        kind: 'WhereCompareNode',
        column: {
          kind: 'ColumnNode',
          expr: d,
        },
        op: x.condition,
        value: x.value,
      };
    };

    const generateFieldSortCondition = (x: FieldSortCondition, d: SQL.ExpressionNode): SQL.SortNode => {
      return {
        kind: 'SortNode',
        column: {
          kind: 'ColumnNode',
          expr: d,
        },
        op: x.condition,
      };
    };

    return generateCollectionField(field)[0];
  }
}

export namespace SQL {
  export class TrustedInput {
    constructor(public value: string) { }
  }

  export class CastedParameter {
    constructor(public parameter: any, public type: string) { }
  }

  export type SelectNode = {
    kind: "SelectNode";
    columns: ColumnNode[];
    from: FromNode;
    joins: JoinNode[];
    groupBy?: GroupByNode;
    conditions?: WhereNode;
    sorts: SortNode[];
    pagination?: PaginationNode;
  }

  export type ColumnNode = {
    kind: "ColumnNode";
    expr: ExpressionNode;
    alias?: string;
  }

  export type ExpressionNode =
    | ApplicationExpressionNode
    | IdentifierExpressionNode
    | StringExpressionNode
    | RawExpressionNode
    | DotExpressionNode
    | CaseExpressionNode
    | BinaryOpExpressionNode

  export type ApplicationExpressionNode = {
    kind: "ApplicationExpressionNode";
    func: ExpressionNode;
    args: ExpressionNode[];
  }

  export type StringExpressionNode = {
    kind: "StringExpressionNode";
    value: string;
  }

  export type IdentifierExpressionNode = {
    kind: "IdentifierExpressionNode";
    name: string;
  }

  export type RawExpressionNode = {
    kind: "RawExpressionNode";
    value: string;
  }

  export type DotExpressionNode = {
    kind: "DotExpressionNode";
    left: ExpressionNode;
    right: ExpressionNode;
  }

  export type CaseExpressionNode = {
    kind: "CaseExpressionNode";
    whens: WhenExpressionNode[];
    else?: ExpressionNode;
  }

  export type WhenExpressionNode = {
    kind: "WhenExpressionNode";
    cond: ExpressionNode;
    value: ExpressionNode;
  }

  export type BinaryOpExpressionNode = {
    kind: "BinaryOpExpressionNode";
    left: ExpressionNode;
    op: "=";
    right: ExpressionNode;
  }

  export type FromNode =
    | FromTableNode
    | FromSelectNode

  export type FromTableNode = {
    kind: "FromTableNode";
    table: string;
    alias: string;
  }

  export type FromSelectNode = {
    kind: "FromSelectNode";
    select: SelectNode;
    alias: string;
  }

  export type JoinNode = {
    kind: "DirectJoinNode";
    op: JoinOp;
    from: FromNode;
    parentId: ColumnNode;
    childId: ColumnNode;
  }

  export type JoinOp =
    | 'inner'
    | 'left'
    | 'right'
    | 'outer'

  export type GroupByNode = {
    kind: "GroupByNode";
    column: ColumnNode;
  }

  export type WhereNode =
    | WhereCompareNode
    | WhereBinaryNode

  export type WhereBinaryOp =
    | "and"
    | "or"

  export type WhereBinaryNode = {
    kind: "WhereBinaryNode";
    left: WhereNode;
    op: WhereBinaryOp;
    right: WhereNode;
  }

  export type WhereCompareNode = {
    kind: "WhereCompareNode";
    column: ColumnNode;
    op: WhereOp;
    value: any;
  }

  export type WhereOp =
    | '='
    | '!='
    | '<='
    | '>='
    | '<'
    | '>'
    | 'is'
    | 'is not'
    | 'in'
    | 'not in'
    | 'like'
    | 'not like'
    | 'ilike'
    | 'not ilike'

  export type SortNode = {
    kind: "SortNode";
    column: ColumnNode;
    op: SortOp;
  }

  export type SortOp =
    | 'asc'
    | 'desc'

  export type PaginationNode = {
    kind: "PaginationNode";
    limit?: number;
    offset?: number;
  }

  export type Builder<T> = {
    sql: (strings: readonly string[], ...values: unknown[]) => T,
    join: (values: unknown[], separator?: string | undefined, prefix?: string | undefined, suffix?: string | undefined) => T,
    empty: T,
    raw: (value: string) => T,
  }


  export function generate<T>(builder: Builder<T>, node: SelectNode): T {

    // console.log('-----------------------------------');
    // console.log(inspect(node, undefined, null, true));
    // console.log('-----------------------------------');

    const generateSelectNode = (n: SelectNode): T => {
      return builder.sql`\
select \
${n.columns.length === 0 ? builder.raw('*') : builder.join(n.columns.map(generateColumnNode), ',')} \
from ${generateFromNode(n.from)}\
${n.joins.length === 0 ? builder.empty : builder.join(n.joins.map(generateJoinNode), '')}\
${n.conditions === undefined ? builder.empty : builder.sql`where ${generateWhereNode(n.conditions)}`}\
${n.groupBy === undefined ? builder.empty : generateGroupByNode(n.groupBy)}\
${n.sorts.length === 0 ? builder.empty : builder.join(n.sorts.map(generateSortNode), ',', ' order by ')}\
${!n.pagination ? builder.empty : generatePaginationNode(n.pagination)}\
`;
    };

    const generateColumnNode = (n: ColumnNode): T => {
      return builder.sql`${generateExpressionNode(n.expr)}${n.alias ? builder.raw(` as "${n.alias}"`) : builder.empty}`;
    };

    const generateExpressionNode = (n: ExpressionNode): T => {
      switch (n.kind) {
        case 'ApplicationExpressionNode': return generateApplicationExpressionNode(n);
        case 'IdentifierExpressionNode': return generateIdentifierExpressionNode(n);
        case 'StringExpressionNode': return generateStringExpressionNode(n);
        case 'RawExpressionNode': return generateRawExpressionNode(n);
        case 'DotExpressionNode': return generateDotExpressionNode(n);
        case 'CaseExpressionNode': return generateCaseExpressionNode(n);
        case 'BinaryOpExpressionNode': return generateBinaryOpExpressionNode(n);
      }
    };

    const generateApplicationExpressionNode = (n: ApplicationExpressionNode): T => {
      return builder.sql`${generateExpressionNode(n.func)}(${n.args.length === 0 ? builder.empty : builder.join(n.args.map(generateExpressionNode), ',')})`;
    };

    const generateIdentifierExpressionNode = (n: IdentifierExpressionNode): T => {
      return builder.raw(`"${n.name}"`);
    };

    const generateStringExpressionNode = (n: StringExpressionNode): T => {
      return builder.raw(`'${n.value}'`);
    };

    const generateRawExpressionNode = (n: RawExpressionNode): T => {
      return builder.raw(n.value);
    };

    const generateDotExpressionNode = (n: DotExpressionNode): T => {
      return builder.sql`${generateExpressionNode(n.left)}.${generateExpressionNode(n.right)}`;
    };

    const generateCaseExpressionNode = (n: CaseExpressionNode): T => {
      return builder.sql`case ${builder.join(n.whens.map(generateWhenExpressionNode), '')}${n.else === undefined ? builder.empty : builder.sql`else ${generateExpressionNode(n.else)}`} end`;
    };

    const generateWhenExpressionNode = (n: WhenExpressionNode): T => {
      return builder.sql`when ${generateExpressionNode(n.cond)} then ${generateExpressionNode(n.value)}`;
    };

    const generateBinaryOpExpressionNode = (n: BinaryOpExpressionNode): T => {
      return builder.sql`(${generateExpressionNode(n.left)} ${builder.raw(n.op)} ${generateExpressionNode(n.right)})`;
    };

    const generateFromNode = (n: FromNode): T => {
      switch (n.kind) {
        case 'FromSelectNode': return generateFromSelectNode(n);
        case 'FromTableNode': return generateFromTableNode(n);
      }
    };

    const generateFromTableNode = (n: FromTableNode): T => {
      return builder.sql`"${builder.raw(n.table)}"${n.alias ? builder.raw(` "${n.alias}"`) : builder.empty}`;
    };

    const generateFromSelectNode = (n: FromSelectNode): T => {
      return builder.sql`(${generateSelectNode(n.select)}) "${builder.raw(n.alias)}"`;
    };

    const generateJoinNode = (n: JoinNode): T => {
      return builder.sql` ${builder.raw(n.op)} join ${generateFromNode(n.from)} on ${generateColumnNode(n.parentId)} = ${generateColumnNode(n.childId)}`;
    };

    const generateGroupByNode = (n: GroupByNode): T => {
      return builder.sql` group by ${generateColumnNode(n.column)}`;
    };

    const generateWhereNode = (n: WhereNode): T => {
      switch (n.kind) {
        case "WhereBinaryNode": return generateWhereBinaryNode(n);
        case "WhereCompareNode": return generateWhereCompareNode(n);
      }
    };

    const generateWhereBinaryNode = (n: WhereBinaryNode): T => {
      return builder.sql`(${generateWhereNode(n.left)}) ${builder.raw(n.op)} (${generateWhereNode(n.right)})`
    };

    const whereValue = (value: any): T | undefined => {
      if (value instanceof TrustedInput)
        return builder.raw(value.value);
      else if (value instanceof CastedParameter)
        return builder.sql`${value.parameter}::"${builder.raw(value.type)}"`;
      else if (Array.isArray(value)) {
        const subValues = value.map(whereValue).filter(x => x !== undefined);
        return subValues.length === 0 ? undefined : builder.sql`(${builder.join(subValues, ',')})`;
      }
      else if (value === 'null')
        return builder.raw('null');
      else if (value !== undefined)
        return builder.sql`${value}`;
      else
        return undefined;
    }

    const generateWhereCompareNode = (n: WhereCompareNode): T => {
      const value = whereValue(n.value);
      return !value ? builder.empty : builder.sql`${generateColumnNode(n.column)} ${builder.raw(n.op)} ${value}`;
    };

    const generateSortNode = (n: SortNode): T => {
      return builder.sql`${generateColumnNode(n.column)} ${builder.raw(n.op)}`;
    };

    const generatePaginationNode = (n: PaginationNode): T => {
      const limit = !n.limit ? builder.empty : builder.raw(` limit ${n.limit}`);
      const offset = !n.offset ? builder.empty : builder.raw(` offset ${n.offset}`);
      return builder.sql`${offset} ${limit}`;
    };

    return generateSelectNode(node);
  };

  export const simpleColumnNode = (table: string, column: string, alias?: string): ColumnNode => {
    return {
      kind: 'ColumnNode',
      expr: {
        kind: 'DotExpressionNode',
        left: {
          kind: 'IdentifierExpressionNode',
          name: table,
        },
        right: {
          kind: 'IdentifierExpressionNode',
          name: column
        },
      },
      alias,
    }
  }
}
