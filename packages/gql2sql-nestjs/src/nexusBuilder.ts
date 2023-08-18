// import { aliasExtensionName, collectionExtensionName, Extension, Field, interfaceExtensionName, prepareSQLForQuery, RelationExtension, relationExtensionName, SummaryHandlerExtension, summaryHandlerExtensionName, tableExtensionName, variantExtensionName } from 'gql2sql';

// interface CollectionTypeBlockOptions extends Omit<FieldOutConfig<any, any>, 'type'> {
//   typeName?: string;
// }

// interface VariantTypeOptions {
//   name: string;
//   definition(t: CollectionTypeBlock): void;
//   tableName?: string;
// }

// interface Relation {
//   parentId: string, to: string, childId: string
// }

// type TypeModifier =
//   | "nonNull"
//   | "list"

// interface FullVariantTypeOptions extends VariantTypeOptions {
//   relations: Relation[];
// }

// class CollectionTypeBlock {
//   private fields: NexusOutputFieldConfigWithName<any, any>[] = [];
//   private aliasName?: string;
//   private relations: Relation[] = [];
//   private typeMods: TypeModifier[] = [];
//   private variants: FullVariantTypeOptions[] = [];
//   private isVariantTag: boolean = false;
//   private variantTag?: string;

//   field(name: string, x: FieldOutConfig<any, any>) {
//     if (this.isVariantTag)
//       this.variantTag = this.aliasName ?? name;
//     this.fields.push({
//       name,
//       ...x,
//       type: this.typeMods.reduce((p, c) => {
//         switch (c) {
//           case 'list':
//             return list(p);
//           case 'nonNull':
//             // @ts-ignore
//             return nonNull(p);
//         }
//       }, x.type),
//       extensions: {
//         ...x.extensions,
//         ...this.aliasName ? aliasExtension(this.aliasName) : undefined,
//         ...this.relations.length === 0 ? undefined : relationExtension(...this.relations),
//       },
//     });
//     this.typeMods = [];
//     this.aliasName = undefined;
//     this.relations = [];
//     this.isVariantTag = false;
//   }

//   int(name: string, config?: Omit<FieldOutConfig<any, any>, 'type'>) {
//     this.field(name, { type: 'Int', ...config });
//   }

//   id(name: string, config?: Omit<FieldOutConfig<any, any>, 'type'>) {
//     this.field(name, { type: 'ID', ...config });
//   }

//   string(name: string, config?: Omit<FieldOutConfig<any, any>, 'type'>) {
//     this.field(name, { type: 'String', ...config });
//   }

//   float(name: string, config?: Omit<FieldOutConfig<any, any>, 'type'>) {
//     this.field(name, { type: 'Float', ...config });
//   }

//   boolean(name: string, config?: Omit<FieldOutConfig<any, any>, 'type'>) {
//     this.field(name, { type: 'Boolean', ...config });
//   }

//   get nonNull() {
//     this.typeMods.push('nonNull');
//     return this;
//   }

//   get list() {
//     this.typeMods.push('list');
//     return this;
//   }

//   alias(name: string) {
//     this.aliasName = name;
//     return this;
//   }

//   get tag() {
//     this.isVariantTag = true;
//     return this;
//   }

//   relation(parentId: string, to: string, childId: string) {
//     this.relations.push({ parentId, to, childId });
//     return this;
//   }

//   collection(name: string, config?: CollectionTypeBlockOptions) {
//     this.field(name, {
//       ...config,
//       // @ts-ignore
//       type: config?.typeName ?? `${name[0].toUpperCase()}${name.slice(1)}`,
//       args: {
//         limit: intArg(),
//         offset: intArg(),
//         ...config?.args,
//       },
//       resolve: x => x[name] ?? {},
//       extensions: {
//         ...collectionExtension(),
//       }
//     });
//   }

//   variant(config: VariantTypeOptions) {
//     this.variants.push({
//       ...config,
//       relations: this.relations,
//     });
//     this.relations = [];
//   }
// }

// export interface CollectionTypeConfig {
//   name: string;
//   definition(t: CollectionTypeBlock): void;
//   description?: string;
//   defaultValue?: any;
//   tableName?: string;
//   pluralForm?: string;
// }

// type NexusField = NexusOutputFieldConfigWithName<any, any>;

// function addImplicitArgs(field: NexusField): NexusField {
//   return {
//     ...field,
//     args: {
//       ...argsForType(field.type as string),
//       ...field.args,
//     },
//   };
// }

// function createSingularCollectionDetailsType(
//   fields: NexusOutputFieldConfigWithName<any, any>[],
//   config: CollectionTypeConfig
// ): TypeDef[] {
//   return [
//     objectType({
//       name: config.name,
//       definition(t) {
//         fields.forEach(f => t.field(addImplicitArgs(f)));
//       },
//       description: config.description,
//       extensions: {
//         ...tableExtension(config.tableName ?? config.name),
//       }
//     }),
//   ];
// }

// function createUnionCollectionDetailsType(
//   fields: NexusOutputFieldConfigWithName<any, any>[],
//   variants: FullVariantTypeOptions[],
//   variantTag: string,
//   config: CollectionTypeConfig
// ): TypeDef[] {
//   return [
//     ...variants.map(v => objectType({
//       name: v.name,
//       definition(t) {
//         const builder = new CollectionTypeBlock();
//         v.definition(builder);
//         // @ts-expect-error
//         builder.fields.forEach(f => t.field(addImplicitArgs(f)));
//         t.implements(config.name)
//       },
//       extensions: {
//         ...v.relations.length === 0 ? undefined : relationExtension(...v.relations),
//         ...variantExtension(variantTag, v.name),
//       }
//     })),
//     // details
//     interfaceType({
//       name: config.name,
//       resolveType: (x) => x[variantTag],
//       definition(t) {
//         fields.forEach(f => t.field(addImplicitArgs(f)));
//       },
//       extensions: {
//         ...tableExtension(config.tableName ?? config.name),
//         ...interfaceExtension(variantTag),
//       }
//     }),
//   ];
// }

// function createCollectionTypes(
//   collectionName: string,
//   summaryName: string,
//   config: CollectionTypeBlockOptions,
// ) {
//   return [
//     // collection
//     objectType({
//       name: collectionName,
//       definition(t) {
//         // @ts-ignore
//         t.nonNull.field('summary', { type: summaryName, resolve: x => x.summary ?? {} });
//         t.nonNull.list.nonNull.field('details', {
//           // @ts-ignore
//           type: config.name, resolve: (x) => x.details ?? []
//         });
//       },
//       description: ``,
//     }),
//     // summary
//     objectType({
//       name: summaryName,
//       definition(t) {
//         t.nonNull.field('total', { type: ArrayAggregation, extensions: { [summaryHandlerExtensionName]: totalSummaryHandler }, resolve: x => x.total ?? {} });
//       },
//       description: ``,
//     }),
//     extendType({
//       type: 'Query',
//       definition(t) {
//         t.nonNull.field(`${collectionName[0].toLowerCase()}${collectionName.slice(1)}`, {
//           // @ts-ignore
//           type: collectionName,
//           async resolve(_root, args, ctx, info) {
//             const query = prepareSQLForQuery(info);
//             // console.log(query.sql);
//             const data = await ctx.prisma.$queryRaw(query);
//             return data[0].root ?? {};
//           },
//           args: {
//             limit: intArg(),
//             offset: intArg(),
//           },
//         })
//       },
//     }),
//   ];
// }

// export const collectionType = (config: CollectionTypeConfig) => {
//   const collectionName = config.pluralForm ?? `${config.name}s`;
//   const summaryName = `${config.name}Summary`;

//   const builder = new CollectionTypeBlock();
//   config.definition(builder);
//   // @ts-ignore
//   const fields = builder.fields;
//   // @ts-ignore
//   const variants = builder.variants;
//   // @ts-ignore
//   const variantTag = builder.variantTag;

//   const isVariant = variants.length > 0;

//   if (isVariant && variantTag === undefined)
//     throw new Error(`Error: You added a variant field without marking another field as the tag to use for the variant`);

//   return [
//     ...createCollectionTypes(collectionName, summaryName, config),
//     ...(isVariant ?
//       createUnionCollectionDetailsType(fields, variants, variantTag!, config) :
//       createSingularCollectionDetailsType(fields, config)
//     ),
//   ];
// }

// const argsForType = (x: string | NexusNonNullDef<string> | NexusListDef<string>): ArgsRecord | undefined => {
//   if (typeof x === "object") {
//     return argsForType(x.ofNexusType);
//   }
//   switch (x) {
//     case 'Int':
//       return {
//         eq: intArg(),
//         neq: intArg(),
//         gt: intArg(),
//         lt: intArg(),
//         gteq: intArg(),
//         lteq: intArg(),
//         isNull: booleanArg(),
//         in: arg({ type: list('Int') }),
//         notIn: arg({ type: list('Int') }),
//         sort: arg({ type: 'SortOp' }),
//         opt: booleanArg(),
//       };
//     case 'Float':
//       return {
//         eq: floatArg(),
//         neq: floatArg(),
//         gt: floatArg(),
//         lt: floatArg(),
//         gteq: floatArg(),
//         lteq: floatArg(),
//         isNull: booleanArg(),
//         in: arg({ type: list('Float') }),
//         notIn: arg({ type: list('Float') }),
//         sort: arg({ type: 'SortOp' }),
//         opt: booleanArg(),
//       };
//     case 'ID':
//       return {
//         eq: idArg(),
//         neq: idArg(),
//         isNull: booleanArg(),
//         in: arg({ type: list('ID') }),
//         notIn: arg({ type: list('ID') }),
//         opt: booleanArg(),
//       };
//     case 'String':
//       return {
//         eq: stringArg(),
//         neq: stringArg(),
//         isNull: booleanArg(),
//         in: arg({ type: list('String') }),
//         notIn: arg({ type: list('String') }),
//         sort: arg({ type: 'SortOp' }),
//         opt: booleanArg(),
//       };
//     case 'Boolean':
//       return {
//         eq: booleanArg(),
//         neq: booleanArg(),
//         isNull: booleanArg(),
//         in: arg({ type: list('Boolean') }),
//         notIn: arg({ type: list('Boolean') }),
//         sort: arg({ type: 'SortOp' }),
//         opt: booleanArg(),
//       };
//   }
// }

// export const tableExtension = (name: string): Extension<typeof tableExtensionName> => {
//   return { [tableExtensionName]: { name } };
// }

// export const aliasExtension = (name: string): Extension<typeof aliasExtensionName> => {
//   return { [aliasExtensionName]: { name } };
// }

// export const relationExtension = (...relations: Relation[]): Extension<typeof relationExtensionName> => {
//   switch (relations.length) {
//     case 1:
//     case 2:
//       return { [relationExtensionName]: relations as [RelationExtension] | [RelationExtension, RelationExtension] };
//     default:
//       throw new Error(`Relations can only be a single or double relation`);
//   }
// }

// export const variantExtension = (column: string, value: string): Extension<typeof variantExtensionName> => {
//   return { [variantExtensionName]: { tag: { column, value } } };
// }

// export const interfaceExtension = (column: string): Extension<typeof interfaceExtensionName> => {
//   return { [interfaceExtensionName]: { tagColumn: column } };
// }

// export const collectionExtension = (): Extension<typeof collectionExtensionName> => {
//   return { [collectionExtensionName]: {} };
// }

// export const sortOpEnum = enumType({
//   name: 'SortOp',
//   members: ['asc', 'desc']
// });

// const totalSummaryHandler: SummaryHandlerExtension = {
//   handler: (selection, subSelection, type) => {
//     return {
//       kind: 'SummaryField',
//       aggregation: subSelection.name.value as Field.Aggregation,
//       field: {
//         kind: 'DetailField',
//         raw: true,
//         name: '1',
//         alias: selection.name.value,
//         skip: false,
//         sorts: [],
//         conditions: [],
//         hasOptionalConditions: false,
//       },
//     };
//   },
// };

// export const ArrayAggregation = objectType({
//   name: 'ArrayAggregation',
//   definition(t) {
//     // @ts-ignore
//     t.nonNull.int('count', { resolve: x => x.count ?? 0 });
//   },
// });

// export const StringAggregation = objectType({
//   name: 'StringAggregation',
//   definition(t) {
//     // @ts-ignore
//     t.nonNull.int('count', { resolve: x => x.count ?? 0 });
//     t.string('max');
//     t.string('min');
//   },
// });

// export const IntegerAggregation = objectType({
//   name: 'IntegerAggregation',
//   definition(t) {
//     // @ts-ignore
//     t.nonNull.int('count', { resolve: x => x.count ?? 0 });
//     t.int('max');
//     t.int('min');
//     t.int('sum');
//     t.float('avg');
//   },
// });

// export const FloatAggregation = objectType({
//   name: 'FloatAggregation',
//   definition(t) {
//     // @ts-ignore
//     t.nonNull.int('count', { resolve: x => x.count ?? 0 });
//     t.float('max');
//     t.float('min');
//     t.float('sum');
//     t.float('avg');
//   },
// });

// export const gql2sqlTypes = [
//   sortOpEnum,
//   ArrayAggregation,
//   StringAggregation,
//   IntegerAggregation,
//   FloatAggregation,
// ];
