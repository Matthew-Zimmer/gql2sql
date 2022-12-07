import { arg, enumType, intArg, objectType, stringArg } from 'nexus'
import { ArgsRecord, booleanArg, extendType, FieldOutConfig, floatArg, idArg, list, NexusOutputFieldConfigWithName } from 'nexus/dist/core';
import { aliasExtensionName, Extension, Field, prepareSQLForQuery, relationExtensionName, SummaryHandlerExtension, summaryHandlerExtensionName, tableExtensionName } from '../utils';

class CollectionTypeBlock {
  private fields: NexusOutputFieldConfigWithName<any, any>[] = [];
  private aliasName?: string;

  field(name: string, x: FieldOutConfig<any, any>) {
    this.fields.push({
      name,
      ...x,
      extensions: {
        ...x.extensions,
        ...this.aliasName ? aliasExtension(this.aliasName) : undefined,
      },
    });
    this.aliasName = undefined;
  }

  int(name: string, config?: FieldOutConfig<any, any>) {
    this.field(name, { type: 'Int', ...config });
  }

  id(name: string, config?: FieldOutConfig<any, any>) {
    this.field(name, { type: 'ID', ...config });
  }

  string(name: string, config?: Omit<FieldOutConfig<any, any>, 'type'>) {
    this.field(name, { type: 'String', ...config });
  }

  float(name: string, config?: FieldOutConfig<any, any>) {
    this.field(name, { type: 'Float', ...config });
  }

  boolean(name: string, config?: FieldOutConfig<any, any>) {
    this.field(name, { type: 'Boolean', ...config });
  }

  alias(name: string) {
    this.aliasName = name;
    return this;
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
  // @ts-expect-error
  const fields = builder.fields;

  return [
    // collection
    objectType({
      name: collectionName,
      definition(t) {
        // @ts-expect-error
        t.field('summary', { type: summaryName });
        // @ts-expect-error
        t.list.field('details', { type: config.name });
      },
      description: ``,
    }),
    // summary
    objectType({
      name: summaryName,
      definition(t) {
        t.field('total', { type: ArrayAggregation, extensions: { [summaryHandlerExtensionName]: totalSummaryHandler } });
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
          // @ts-expect-error
          type: collectionName,
          async resolve(_root, args, ctx, info) {
            const query = prepareSQLForQuery(info);
            const data = await ctx.prisma.$queryRaw<{ root: any }[]>(query);
            return data[0].root;
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

export const relationExtension = (to: string, parentId: string, childId: string): Extension<typeof relationExtensionName> => {
  return { [relationExtensionName]: { childId, parentId, to } };
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
    t.int('count');
  },
});

export const StringAggregation = objectType({
  name: 'StringAggregation',
  definition(t) {
    t.int('count');
    t.string('max');
    t.string('min');
  },
});

export const IntegerAggregation = objectType({
  name: 'IntegerAggregation',
  definition(t) {
    t.int('count');
    t.int('max');
    t.int('min');
    t.int('sum');
    t.float('avg');
  },
});

export const FloatAggregation = objectType({
  name: 'FloatAggregation',
  definition(t) {
    t.int('count');
    t.float('max');
    t.float('min');
    t.float('sum');
    t.float('avg');
  },
});
