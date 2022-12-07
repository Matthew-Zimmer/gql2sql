import { arg, enumType, intArg, objectType, stringArg } from 'nexus'
import { aliasExtensionName, Field, relationExtensionName, SummaryHandlerExtension, summaryHandlerExtensionName, tableExtensionName } from '../utils';




export const Post = objectType({
  name: 'Post',
  extensions: { [tableExtensionName]: { name: 'Post' } },
  definition(t) {
    t.nonNull.id('id');

    t.string('title', { args: { eq: stringArg(), sort: arg({ type: 'SortOp' }) } });

    t.field('authors', { type: 'Authors', extensions: { [relationExtensionName]: { parentId: 'author_id', childId: 'id', to: 'author' } } })
  },
});

export const PostSummary = objectType({
  name: 'PostSummary',
  definition(t) {
    t.field('total', { type: ArrayAggregation, extensions: { [summaryHandlerExtensionName]: totalSummaryHandler } });
  },
});

export const Posts = objectType({
  name: 'Posts',
  definition(t) {
    t.field('summary', { type: 'PostSummary' });
    t.list.nonNull.field('details', { type: 'Post' });
  },
});

export const Author = objectType({
  name: 'Author',
  extensions: { [tableExtensionName]: { name: 'Author' } },
  definition(t) {
    t.nonNull.id('id');
    t.string('firstName', { extensions: { [aliasExtensionName]: { name: 'first_name' } }, args: { eq: stringArg(), sort: arg({ type: 'SortOp' }) } });
    t.string('lastName', { extensions: { [aliasExtensionName]: { name: 'last_name' } } });
  },
});

export const AuthorSummary = objectType({
  name: 'AuthorSummary',
  definition(t) {
    t.field('total', { type: ArrayAggregation, extensions: { [summaryHandlerExtensionName]: totalSummaryHandler } });
  },
});

export const Authors = objectType({
  name: 'Authors',
  definition(t) {
    t.field('summary', { type: 'AuthorSummary' });
    t.list.nonNull.field('details', { type: 'Author' });
  },
});
















// --------------------------------------------------
// library code
// --------------------------------------------------

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
