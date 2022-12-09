import { Prisma } from '@prisma/client';
import { ArgumentNode, BooleanValueNode, FieldNode, FloatValueNode, GraphQLField, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLResolveInfo, GraphQLType, IntValueNode, isListType, isNonNullType, isObjectType, Kind, ListValueNode, NullValueNode, SelectionNode, StringValueNode, ValueNode, VariableNode } from 'graphql';
import { inspect } from 'util';

export const prepareSQLForQuery = (info: GraphQLResolveInfo): Prisma.Sql => {
  const collection = generateFieldFromQuery(info);
  const select = Field.generate(collection);
  const query = SQL.generate(select);
  return query;
}

export const relationExtensionName = 'relation';
export interface RelationExtension {
  parentId: string;
  childId: string;
  to: string;
}

export const aliasExtensionName = 'alias';
export interface AliasExtension {
  name: string;
}

export const tableExtensionName = 'table';
export interface TableExtension {
  name: string;
}

export const summaryHandlerExtensionName = 'summaryHandler';
export interface SummaryHandlerExtension {
  handler: (selection: FieldNode, subSelection: FieldNode, type: GraphQLObjectType) => Field.SummaryField;
}

interface Extensions {
  [relationExtensionName]: [RelationExtension] | [RelationExtension, RelationExtension];
  [aliasExtensionName]: AliasExtension;
  [tableExtensionName]: TableExtension;
  [summaryHandlerExtensionName]: SummaryHandlerExtension;
}

export type Extension<K extends keyof Extensions> = Record<K, Extensions[K]>;

const getExtension = <K extends keyof Extensions>(extensions: any, name: K, defaultValue: Extensions[K]): Extensions[K] => {
  return name in extensions ? extensions[name] : defaultValue;
}

const reduceType = (t: GraphQLType): Exclude<GraphQLType, GraphQLNonNull<any> | GraphQLList<any>> => {
  if (isNonNullType(t)) return reduceType(t.ofType);
  else if (isListType(t)) return reduceType(t.ofType);
  else return t;
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
} as const;

type PrimitiveValueType =
  | BooleanValueNode
  | IntValueNode
  | FloatValueNode
  | StringValueNode

const isPrimitiveValueType = (n: ValueNode): n is PrimitiveValueType => {
  switch (n.kind) {
    case Kind.BOOLEAN:
    case Kind.INT:
    case Kind.FLOAT:
    case Kind.STRING:
      return true;
    default:
      return false;
  }
}

const toSqlLike = (x: any, nested?: boolean): any => {
  switch (typeof x) {
    case 'boolean':
    case 'string':
    case 'number':
      return x;
    case 'object':
      if (x === null)
        return 'null';
      else if (Array.isArray(x) && !nested)
        return x.map(x => toSqlLike(x, true)).join(',');
    default:
      throw new Error(`Cannot convert ${x} to sql like safely`);
  }
}

export const generateFieldFromQuery = (info: GraphQLResolveInfo): Field.CollectionField => {
  const root = info.fieldNodes[0];

  const lookupVariable = (name: string): any => {
    return info.variableValues[name];
  }

  const lookupVariableToSqlLike = (name: string): string => {
    return toSqlLike(lookupVariable(name));
  }

  const visitCollectionSelections = (selections: readonly SelectionNode[], type: GraphQLObjectType): [Field.DetailField[], Field.SummaryField[], Field.RelationField[]] => {
    let details: Field.DetailField[] = [];
    let summaries: Field.SummaryField[] = [];
    let relations: Field.RelationField[] = [];

    for (const selection of selections) {
      switch (selection.kind) {
        case Kind.FIELD: {
          switch (selection.name.value) {
            case 'details':
              [details, relations] = visitDetailSelections(selection.selectionSet?.selections ?? [], reduceToObjectType(type.getFields()['details'].type));
              break;
            case 'summary':
              summaries = visitSummarySelections(selection.selectionSet?.selections ?? [], reduceToObjectType(type.getFields()['summary'].type));
              break;
          }
        }
      }
    }

    return [details, summaries, relations];
  };

  const visitDetailSelections = (selections: readonly SelectionNode[], type: GraphQLObjectType): [Field.DetailField[], Field.RelationField[]] => {
    let details: Field.DetailField[] = [];
    let relations: Field.RelationField[] = [];

    for (const selection of selections) {
      switch (selection.kind) {
        case Kind.FIELD: {
          // we still need to look at the arguments and directives
          const name = selection.name.value;
          const field = type.getFields()[name];
          const { extensions, type: fieldType } = field;

          if (relationExtensionName in extensions) {
            const relation = getExtension(extensions, relationExtensionName, null as any);
            relations.push({
              kind: 'RelationField',
              relation: relation.length === 1 ? {
                kind: 'DirectRelation',
                ...relation[0]
              } : {
                kind: 'JunctionRelation',
                toJunction: { kind: 'DirectRelation', ...relation[0] },
                fromJunction: { kind: 'DirectRelation', ...relation[1] },
              },
              collection: createCollection(selection, reduceToObjectType(fieldType)),
            });
          }
          else {
            details.push(createDetailField(selection, type));
          }
        }
          break;
      }
    }

    return [details, relations];
  };

  const defaultSummaryHandlerExtension: SummaryHandlerExtension = {
    handler: (selection, subSelection, type) => {
      return {
        kind: 'SummaryField',
        aggregation: subSelection.name.value as Field.Aggregation,
        field: createDetailField(selection, type),
      };
    },
  };

  const visitSummarySelections = (selections: readonly SelectionNode[], type: GraphQLObjectType): Field.SummaryField[] => {
    let summaries: Field.SummaryField[] = [];

    for (const selection of selections) {
      switch (selection.kind) {
        case Kind.FIELD: {
          const { extensions } = type.getFields()[selection.name.value];
          for (const subSelection of selection.selectionSet?.selections ?? []) {
            switch (subSelection.kind) {
              case Kind.FIELD: {
                const { handler } = getExtension(extensions, summaryHandlerExtensionName, defaultSummaryHandlerExtension);
                summaries.push(handler(selection, subSelection, type));
              }
                break;
            }
          }
        }
          break;
      }
    }

    return summaries;
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

  const isSkipped = (x: FieldNode): boolean => {
    const directives = x.directives ?? [];
    const skipDirective = directives.find(x => x.name.value === 'skip');
    if (!skipDirective) return false;
    const args = skipDirective.arguments ?? [];
    const ifArg = args.find(x => x.name.value === 'if');
    if (!ifArg) return false;
    return ifArg.value.kind === Kind.BOOLEAN && ifArg.value.value;
  };

  const createCollection = (field: FieldNode, type: GraphQLObjectType): Field.CollectionField => {
    const [details, summaries, relations] = visitCollectionSelections(field.selectionSet?.selections ?? [], type);

    const extensions = reduceToObjectType(type.getFields()['details'].type).extensions;
    if (!(tableExtensionName in extensions))
      throw new Error(`Collection type: ${type.name}'s details does not have the associated table extension, please fix`);

    const tableExtension = extensions[tableExtensionName] as TableExtension;

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
      pagination,
    };
  };

  const createDetailField = (x: FieldNode, type: GraphQLObjectType): Field.DetailField => {
    const name = x.name.value;
    const { extensions } = type.getFields()[name];
    const [sorts, conditions] = sortAndFilterConditionsFromArgs(x.arguments ?? []);
    const skip = isSkipped(x);

    return {
      kind: 'DetailField',
      alias: name,
      name: aliasExtensionName in extensions ? (extensions[aliasExtensionName] as AliasExtension).name : name,
      skip,
      conditions,
      sorts,
    };
  }

  const sortAndFilterConditionsFromArgs = (args: readonly ArgumentNode[]): [Field.FieldSortCondition[], Field.FieldFilterCondition[]] => {
    const sorts: Field.FieldSortCondition[] = [];
    const filters: Field.FieldFilterCondition[] = [];

    for (const arg of args) {
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
        let value: any | undefined = undefined;

        switch (arg.value.kind) {
          case Kind.INT:
          case Kind.BOOLEAN:
          case Kind.FLOAT:
          case Kind.STRING:
            value = arg.value.value;
            break;
          case Kind.LIST:
            value = arg.value.values.filter(isPrimitiveValueType).map(x => x.value);
            break;
          case Kind.VARIABLE:
            value = lookupVariableToSqlLike(arg.value.name.value);
            break;
        }

        if (value)
          filters.push({
            kind: 'FieldFilterCondition',
            condition: filterNames[name as keyof typeof filterNames],
            value,
          });
      }
      else if (name === "isNull") {
        const value = (arg.value as BooleanValueNode).value;
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
  export interface CollectionField {
    kind: "Collection";
    skip: boolean;
    name: string;
    table: string;
    summaries: SummaryField[];
    details: DetailField[];
    relations: RelationField[];
    pagination?: PaginationField;
  }

  export interface SummaryField {
    kind: "SummaryField";
    aggregation: Aggregation;
    field: DetailField;
  }

  export type Aggregation =
    | 'sum'
    | 'count'
    | 'max'
    | 'min'
    | 'avg'

  export interface DetailField {
    kind: "DetailField";
    skip: boolean;
    name: string;
    alias: string;
    conditions: FieldFilterCondition[];
    sorts: FieldSortCondition[];
    raw?: boolean;
  }

  export interface FieldFilterCondition {
    kind: "FieldFilterCondition";
    condition: SQL.WhereOp;
    value: any;
  }

  export interface FieldSortCondition {
    kind: "FieldSortCondition";
    condition: SQL.SortOp;
  }

  export interface RelationField {
    kind: "RelationField";
    relation: Relation;
    collection: CollectionField;
  }

  export type Relation =
    | DirectRelation
    | JunctionRelation

  export interface DirectRelation {
    kind: "DirectRelation";
    to: string;
    parentId: string;
    childId: string;
  }

  export interface JunctionRelation {
    kind: "JunctionRelation";
    toJunction: DirectRelation;
    fromJunction: DirectRelation;
  }

  export interface PaginationField {
    kind: "PaginationField";
    offset?: number;
    limit?: number;
  }

  interface CollectionMetaInfo {
    hasFilters: boolean;
    hasPagination: boolean;
  }

  /**
   * TODO!! need to do something with the summary filter and sort arguments
   */
  export function generate(field: CollectionField): SQL.SelectNode {
    // console.log('-----------------------------------');
    // console.log(inspect(field, undefined, null, true));
    // console.log('-----------------------------------');

    let tableAliasCount = 0;
    const makeTableAlias = () => `t${tableAliasCount++}`;

    const generateCollectionField = (x: CollectionField): [SQL.SelectNode, string, CollectionMetaInfo] => {
      const rawTable = makeTableAlias();
      const table = makeTableAlias();

      const [details, detailsWhereNodes, detailsSortNodes] = generateDetailFields(x.details, rawTable, table);
      const [summary, summaryHavingNodes, summarySortNodes] = generateSummaryFields(x.summaries, table);
      const relations = generateRelationFields(x.relations, rawTable);

      const fullDetails = createDetailsAggExpression([
        ...details,
        ...x.relations.filter(x => !x.collection.skip).flatMap<SQL.ExpressionNode>(r => [
          { kind: 'StringExpressionNode', value: r.collection.name },
          { kind: 'DotExpressionNode', left: { kind: 'IdentifierExpressionNode', name: table }, right: { kind: 'IdentifierExpressionNode', name: r.collection.name } }
        ]),
      ]);

      const node: SQL.SelectNode = {
        kind: 'SelectNode',
        columns: x.skip ? [] : [{
          kind: 'ColumnNode',
          expr: {
            kind: 'ApplicationExpressionNode',
            func: {
              kind: 'RawExpressionNode',
              value: 'json_build_object'
            },
            args: [
              ...(x.details.length + x.relations.length === 0 ? [] : [{ kind: 'StringExpressionNode' as const, value: 'details' }, fullDetails]),
              ...(x.summaries.length === 0 ? [] : [{ kind: 'StringExpressionNode' as const, value: 'summary' }, summary]),
            ]
          },
          alias: x.name,
        }],
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
            joins: relations,
            conditions: detailsWhereNodes,
            sorts: detailsSortNodes,
            pagination: !x.pagination ? undefined : {
              kind: 'PaginationNode',
              limit: x.pagination.limit,
              offset: x.pagination.offset,
            },
          },
        },
        joins: [],
        conditions: [],
        sorts: [],
      };

      const info: CollectionMetaInfo = {
        hasFilters: detailsWhereNodes.length !== 0,
        hasPagination: x.pagination !== undefined,
      };

      return [node, table, info];
    };

    const createDetailsAggExpression = (args: SQL.ExpressionNode[]): SQL.ExpressionNode => {
      return { kind: 'ApplicationExpressionNode', func: { kind: 'RawExpressionNode', value: 'array_agg' }, args: [{ kind: 'ApplicationExpressionNode', func: { kind: 'RawExpressionNode', value: 'json_build_object' }, args }] };
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

    const generateSummaryFields = (x: SummaryField[], table: string): [SQL.ExpressionNode, SQL.WhereNode[], SQL.SortNode[]] => {
      const whereNodes: SQL.WhereNode[] = [];
      const sortNodes: SQL.SortNode[] = [];
      const args: SQL.ExpressionNode[] = [];

      for (const f of x) {
        const [cols, wNodes, sNodes] = generateSummaryField(f, table, table);
        args.push(...cols);
        whereNodes.push(...wNodes);
        sortNodes.push(...sNodes);
      }

      return [{ kind: 'ApplicationExpressionNode', func: { kind: 'RawExpressionNode', value: 'json_build_object' }, args }, whereNodes, sortNodes];
    };

    const generateSummaryField = (x: SummaryField, rawTable: string, table: string): [[SQL.StringExpressionNode, SQL.ApplicationExpressionNode] | [], SQL.WhereNode[], SQL.SortNode[]] => {
      const [col, whereNodes, sortNodes] = generateDetailField(x.field, rawTable, table);

      return [
        col.length === 0 ? [] : [
          col[0],
          {
            kind: 'ApplicationExpressionNode',
            func: {
              kind: 'RawExpressionNode',
              value: 'json_build_object',
            },
            args: [
              { kind: 'StringExpressionNode', value: x.aggregation },
              { kind: 'ApplicationExpressionNode', func: { kind: 'RawExpressionNode', value: x.aggregation }, args: [col[1]] }
            ]
          }
        ],
        whereNodes,
        sortNodes
      ];
    };

    const generateRelationFields = (x: RelationField[], table: string): SQL.JoinNode[] => {
      return x.map(f => generateRelationField(f, table));
    };

    const generateRelationField = (x: RelationField, table: string): SQL.JoinNode => {
      const [collection, collectionTable, info] = generateCollectionField(x.collection);

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
          const groupedCollection: SQL.SelectNode = {
            ...collection,
            ...paginatedFrom,
            groupBy: {
              kind: 'GroupByNode',
              column: { kind: 'ColumnNode', expr: { kind: 'IdentifierExpressionNode', name: groupColumName } },
            },
            columns: [
              SQL.simpleColumnNode(collectionTable, x.relation.childId, groupColumName),
              ...collection.columns,
            ],
            conditions: [
              ...collection.conditions,
              ...fromSelectNode.select.pagination?.limit === undefined ? [] : [{
                kind: 'WhereNode' as const,
                column: rowNumberColumn,
                op: '<=' as const,
                value: fromSelectNode.select.pagination?.limit! + (fromSelectNode.select.pagination?.offset ?? 0),
              }],
              ...fromSelectNode.select.pagination?.offset === undefined ? [] : [{
                kind: 'WhereNode' as const,
                column: rowNumberColumn,
                op: '>' as const,
                value: fromSelectNode.select.pagination?.offset!,
              }],
            ],
          };
          return {
            kind: 'DirectJoinNode',
            op: info.hasFilters ? 'inner' : 'left',
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
            groupBy: {
              kind: 'GroupByNode',
              column: { kind: 'ColumnNode', expr: { kind: 'IdentifierExpressionNode', name: groupColumName } },
            },
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
            op: info.hasFilters ? 'inner' : 'left',
            parentId: SQL.simpleColumnNode(table, x.relation.toJunction.parentId),
            childId: SQL.simpleColumnNode(joinTable, groupColumName),
            from: { kind: 'FromSelectNode', select: groupedCollection, alias: joinTable },
          };
        }
      }
    };

    const generateFieldFilterCondition = (x: FieldFilterCondition, d: SQL.ExpressionNode): SQL.WhereNode => {
      return {
        kind: 'WhereNode',
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
  export interface SelectNode {
    kind: "SelectNode";
    columns: ColumnNode[];
    from: FromNode;
    joins: JoinNode[];
    groupBy?: GroupByNode;
    conditions: WhereNode[];
    sorts: SortNode[];
    pagination?: PaginationNode;
  }

  export interface ColumnNode {
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

  export interface ApplicationExpressionNode {
    kind: "ApplicationExpressionNode";
    func: ExpressionNode;
    args: ExpressionNode[];
  }

  export interface StringExpressionNode {
    kind: "StringExpressionNode";
    value: string;
  }

  export interface IdentifierExpressionNode {
    kind: "IdentifierExpressionNode";
    name: string;
  }

  export interface RawExpressionNode {
    kind: "RawExpressionNode";
    value: string;
  }

  export interface DotExpressionNode {
    kind: "DotExpressionNode";
    left: ExpressionNode;
    right: ExpressionNode;
  }

  export type FromNode =
    | FromTableNode
    | FromSelectNode

  export interface FromTableNode {
    kind: "FromTableNode";
    table: string;
    alias: string;
  }

  export interface FromSelectNode {
    kind: "FromSelectNode";
    select: SelectNode;
    alias: string;
  }

  export interface JoinNode {
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

  export interface GroupByNode {
    kind: "GroupByNode";
    column: ColumnNode;
  }

  export interface WhereNode {
    kind: "WhereNode";
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

  export interface SortNode {
    kind: "SortNode";
    column: ColumnNode;
    op: SortOp;
  }

  export type SortOp =
    | 'asc'
    | 'desc'

  export interface PaginationNode {
    kind: "PaginationNode";
    limit?: number;
    offset?: number;
  }

  export function generate(node: SelectNode): Prisma.Sql {

    // console.log('-----------------------------------');
    // console.log(inspect(node, undefined, null, true));
    // console.log('-----------------------------------');

    const generateSelectNode = (n: SelectNode): Prisma.Sql => {
      return Prisma.sql`\
select \
${n.columns.length === 0 ? Prisma.raw('*') : Prisma.join(n.columns.map(generateColumnNode), ',')} \
from ${generateFromNode(n.from)}\
${n.joins.length === 0 ? Prisma.empty : Prisma.join(n.joins.map(generateJoinNode))}\
${n.conditions.length === 0 ? Prisma.empty : Prisma.join(n.conditions.map(generateWhereNode), ' and ', ' where ')}\
${n.groupBy === undefined ? Prisma.empty : generateGroupByNode(n.groupBy)}\
${n.sorts.length === 0 ? Prisma.empty : Prisma.join(n.sorts.map(generateSortNode), ',', ' order by ')}\
${!n.pagination ? Prisma.empty : generatePaginationNode(n.pagination)}\
`;
    };

    const generateColumnNode = (n: ColumnNode): Prisma.Sql => {
      return Prisma.sql`${generateExpressionNode(n.expr)}${n.alias ? Prisma.raw(` as "${n.alias}"`) : Prisma.empty}`;
    };

    const generateExpressionNode = (n: ExpressionNode): Prisma.Sql => {
      switch (n.kind) {
        case 'ApplicationExpressionNode': return generateApplicationExpressionNode(n);
        case 'IdentifierExpressionNode': return generateIdentifierExpressionNode(n);
        case 'StringExpressionNode': return generateStringExpressionNode(n);
        case 'RawExpressionNode': return generateRawExpressionNode(n);
        case 'DotExpressionNode': return generateDotExpressionNode(n);
      }
    };

    const generateApplicationExpressionNode = (n: ApplicationExpressionNode): Prisma.Sql => {
      return Prisma.sql`${generateExpressionNode(n.func)}(${n.args.length === 0 ? Prisma.empty : Prisma.join(n.args.map(generateExpressionNode), ',')})`;
    };

    const generateIdentifierExpressionNode = (n: IdentifierExpressionNode): Prisma.Sql => {
      return Prisma.raw(`"${n.name}"`);
    };

    const generateStringExpressionNode = (n: StringExpressionNode): Prisma.Sql => {
      return Prisma.raw(`'${n.value}'`);
    };

    const generateRawExpressionNode = (n: RawExpressionNode): Prisma.Sql => {
      return Prisma.raw(n.value);
    };

    const generateDotExpressionNode = (n: DotExpressionNode): Prisma.Sql => {
      return Prisma.sql`${generateExpressionNode(n.left)}.${generateExpressionNode(n.right)}`;
    };

    const generateFromNode = (n: FromNode): Prisma.Sql => {
      switch (n.kind) {
        case 'FromSelectNode': return generateFromSelectNode(n);
        case 'FromTableNode': return generateFromTableNode(n);
      }
    };

    const generateFromTableNode = (n: FromTableNode): Prisma.Sql => {
      return Prisma.sql`"${Prisma.raw(n.table)}"${n.alias ? Prisma.raw(` "${n.alias}"`) : Prisma.empty}`;
    };

    const generateFromSelectNode = (n: FromSelectNode): Prisma.Sql => {
      return Prisma.sql`(${generateSelectNode(n.select)}) "${Prisma.raw(n.alias)}"`;
    };

    const generateJoinNode = (n: JoinNode): Prisma.Sql => {
      return Prisma.sql` ${Prisma.raw(n.op)} join ${generateFromNode(n.from)} on ${generateColumnNode(n.parentId)} = ${generateColumnNode(n.childId)}`;
    };

    const generateGroupByNode = (n: GroupByNode): Prisma.Sql => {
      return Prisma.sql` group by ${generateColumnNode(n.column)}`;
    };

    const generateWhereNode = (n: WhereNode): Prisma.Sql => {
      let value: Prisma.Sql | undefined = undefined;

      if (Array.isArray(n.value)) {
        if (n.value.length > 0)
          value = Prisma.sql`(${Prisma.join(n.value.map(x => Prisma.sql`${x}`), ',')})`;
      }
      else if (n.value === 'null')
        value = Prisma.raw('null');
      else
        value = Prisma.sql`${n.value}`;

      if (!value)
        return Prisma.empty;

      return Prisma.sql`${generateColumnNode(n.column)} ${Prisma.raw(n.op)} ${value}`;
    };

    const generateSortNode = (n: SortNode): Prisma.Sql => {
      return Prisma.sql`${generateColumnNode(n.column)} ${Prisma.raw(n.op)}`;
    };

    const generatePaginationNode = (n: PaginationNode): Prisma.Sql => {
      const limit = !n.limit ? Prisma.empty : Prisma.raw(` limit ${n.limit}`);
      const offset = !n.offset ? Prisma.empty : Prisma.raw(` offset ${n.offset}`);
      return Prisma.sql`${offset} ${limit}`;
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
