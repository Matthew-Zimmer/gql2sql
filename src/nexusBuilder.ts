import { arg, enumType, intArg, objectType, stringArg } from 'nexus'
import { ArgsRecord, booleanArg, extendType, FieldOutConfig, floatArg, idArg, list, NexusOutputFieldConfigWithName, nonNull } from 'nexus/dist/core';
import { aliasExtensionName, Extension, Field, prepareSQLForQuery, RelationExtension, relationExtensionName, SummaryHandlerExtension, summaryHandlerExtensionName, TableExtension, tableExtensionName } from './compiler';

interface CollectionTypeBlockOptions extends Omit<FieldOutConfig<any, any>, 'type'> {
  typeName?: string;
}

class CollectionTypeBlock {
  private fields: NexusOutputFieldConfigWithName<any, any>[] = [];
  private aliasName?: string;
  private relations: { parentId: string, to: string, childId: string }[] = [];
  private typeMods: ('nonNull' | 'list')[] = [];

  field(name: string, x: FieldOutConfig<any, any>) {
    this.fields.push({
      name,
      ...x,
      type: this.typeMods.reduce((p, c) => {
        switch (c) {
          case 'list':
            return list(p);
          case 'nonNull':
            // @ts-ignore
            return nonNull(p);
        }
      }, x.type),
      extensions: {
        ...x.extensions,
        ...this.aliasName ? aliasExtension(this.aliasName) : undefined,
        ...this.relations.length === 0 ? undefined : relationExtension(...this.relations),
      },
    });
    this.typeMods = [];
    this.aliasName = undefined;
    this.relations = [];
  }

  int(name: string, config?: Omit<FieldOutConfig<any, any>, 'type'>) {
    this.field(name, { type: 'Int', ...config });
  }

  id(name: string, config?: Omit<FieldOutConfig<any, any>, 'type'>) {
    this.field(name, { type: 'ID', ...config });
  }

  string(name: string, config?: Omit<FieldOutConfig<any, any>, 'type'>) {
    this.field(name, { type: 'String', ...config });
  }

  float(name: string, config?: Omit<FieldOutConfig<any, any>, 'type'>) {
    this.field(name, { type: 'Float', ...config });
  }

  boolean(name: string, config?: Omit<FieldOutConfig<any, any>, 'type'>) {
    this.field(name, { type: 'Boolean', ...config });
  }

  get nonNull() {
    this.typeMods.push('nonNull');
    return this;
  }

  get list() {
    this.typeMods.push('list');
    return this;
  }

  alias(name: string) {
    this.aliasName = name;
    return this;
  }

  relation(parentId: string, to: string, childId: string) {
    this.relations.push({ parentId, to, childId });
    return this;
  }

  collection(name: string, config?: CollectionTypeBlockOptions) {
    this.field(name, {
      ...config,
      // @ts-ignore
      type: config?.typeName ?? `${name[0].toUpperCase()}${name.slice(1)}`,
      args: {
        limit: intArg(),
        offset: intArg(),
        ...config?.args,
      },
      resolve: x => x[name] ?? {},
    });
  }
}

export interface CollectionTypeConfig {
  name: string;
  definition(t: CollectionTypeBlock): void;
  description?: string;
  defaultValue?: any;
  tableName?: string;
  pluralForm?: string;
}

export const collectionType = (config: CollectionTypeConfig) => {
  const collectionName = config.pluralForm ?? `${config.name}s`;
  const summaryName = `${config.name}Summary`;

  const builder = new CollectionTypeBlock();
  config.definition(builder);
  // @ts-ignore
  const fields = builder.fields;

  return [
    // collection
    objectType({
      name: collectionName,
      definition(t) {
        // @ts-ignore
        t.field('summary', { type: summaryName, resolve: x => x.summary ?? {} });
        t.list.field('details', {
          // @ts-ignore
          type: config.name, resolve: (x) => x.details ?? []
        });
      },
      description: ``,
    }),
    // summary
    objectType({
      name: summaryName,
      definition(t) {
        t.field('total', { type: ArrayAggregation, extensions: { [summaryHandlerExtensionName]: totalSummaryHandler }, resolve: x => x.total ?? {} });
      },
      description: ``,
    }),
    // details
    objectType({
      name: config.name,
      definition(t) {
        fields.forEach(f => {
          t.field({
            ...f,
            args: {
              ...argsForType(f.type as string),
              ...f.args,
            },
            extensions: {
              ...f.extensions,
            },
          });
        });
      },
      description: config.description,
      extensions: {
        ...tableExtension(config.tableName ?? config.name),
      }
    }),
    extendType({
      type: 'Query',
      definition(t) {
        t.field(`${collectionName[0].toLowerCase()}${collectionName.slice(1)}`, {
          // @ts-ignore
          type: collectionName,
          async resolve(_root, args, ctx, info) {
            const query = prepareSQLForQuery(info);
            // console.log(query.sql);
            const data = await ctx.prisma.$queryRaw(query);
            return data[0].root ?? {};
          },
          args: {
            limit: intArg(),
            offset: intArg(),
          },
        })
      },
    }),
  ];
}

const argsForType = (x: string): ArgsRecord | undefined => {
  switch (x) {
    case 'Int':
      return {
        eq: intArg(),
        neq: intArg(),
        gt: intArg(),
        lt: intArg(),
        gteq: intArg(),
        lteq: intArg(),
        isNull: booleanArg(),
        in: arg({ type: list('Int') }),
        notIn: arg({ type: list('Int') }),
        sort: arg({ type: 'SortOp' }),
      };
    case 'Float':
      return {
        eq: floatArg(),
        neq: floatArg(),
        gt: floatArg(),
        lt: floatArg(),
        gteq: floatArg(),
        lteq: floatArg(),
        isNull: booleanArg(),
        in: arg({ type: list('Float') }),
        notIn: arg({ type: list('Float') }),
        sort: arg({ type: 'SortOp' }),
      };
    case 'ID':
      return {
        eq: idArg(),
        neq: idArg(),
        isNull: booleanArg(),
        in: arg({ type: list('ID') }),
        notIn: arg({ type: list('ID') }),
      };
    case 'String':
      return {
        eq: stringArg(),
        neq: stringArg(),
        isNull: booleanArg(),
        in: arg({ type: list('String') }),
        notIn: arg({ type: list('String') }),
        sort: arg({ type: 'SortOp' }),
      };
    case 'Boolean':
      return {
        eq: booleanArg(),
        neq: booleanArg(),
        isNull: booleanArg(),
        in: arg({ type: list('Boolean') }),
        notIn: arg({ type: list('Boolean') }),
        sort: arg({ type: 'SortOp' }),
      };
  }
}

export const tableExtension = (name: string): Extension<typeof tableExtensionName> => {
  return { [tableExtensionName]: { name } };
}

export const aliasExtension = (name: string): Extension<typeof aliasExtensionName> => {
  return { [aliasExtensionName]: { name } };
}

export const relationExtension = (...relations: { to: string, parentId: string, childId: string }[]): Extension<typeof relationExtensionName> => {
  switch (relations.length) {
    case 1:
    case 2:
      return { [relationExtensionName]: relations as [RelationExtension] | [RelationExtension, RelationExtension] };
    default:
      throw new Error(`Relations can only be a single or double relation`);
  }
}

export const sortOpEnum = enumType({
  name: 'SortOp',
  members: ['asc', 'desc']
});

const totalSummaryHandler: SummaryHandlerExtension = {
  handler: (selection, subSelection, type) => {
    return {
      kind: 'SummaryField',
      aggregation: subSelection.name.value as Field.Aggregation,
      field: {
        kind: 'DetailField',
        raw: true,
        name: '1',
        alias: selection.name.value,
        skip: false,
        sorts: [],
        conditions: [],
      },
    };
  },
};

export const ArrayAggregation = objectType({
  name: 'ArrayAggregation',
  definition(t) {
    // @ts-ignore
    t.nonNull.int('count', { resolve: x => x.count ?? 0 });
  },
});

export const StringAggregation = objectType({
  name: 'StringAggregation',
  definition(t) {
    // @ts-ignore
    t.nonNull.int('count', { resolve: x => x.count ?? 0 });
    t.string('max');
    t.string('min');
  },
});

export const IntegerAggregation = objectType({
  name: 'IntegerAggregation',
  definition(t) {
    // @ts-ignore
    t.nonNull.int('count', { resolve: x => x.count ?? 0 });
    t.int('max');
    t.int('min');
    t.int('sum');
    t.float('avg');
  },
});

export const FloatAggregation = objectType({
  name: 'FloatAggregation',
  definition(t) {
    // @ts-ignore
    t.nonNull.int('count', { resolve: x => x.count ?? 0 });
    t.float('max');
    t.float('min');
    t.float('sum');
    t.float('avg');
  },
});

export const gql2sqlTypes = [
  sortOpEnum,
  ArrayAggregation,
  StringAggregation,
  IntegerAggregation,
  FloatAggregation,
];
