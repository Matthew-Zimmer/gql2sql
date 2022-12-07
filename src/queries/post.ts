import { Post } from '../models';
import { extendType } from 'nexus'
import { prepareSQLForQuery } from '../utils';
import { NexusGenFieldTypes } from '../nexus-typegen';

export const PostQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('posts', {
      type: 'Posts',
      async resolve(_root, args, ctx, info) {
        const query = prepareSQLForQuery(info);
        console.log(query.sql);
        const data = await ctx.prisma.$queryRaw<{ root: NexusGenFieldTypes['Posts'] }[]>(query);
        return data[0].root;
      },
    })
  },
});
