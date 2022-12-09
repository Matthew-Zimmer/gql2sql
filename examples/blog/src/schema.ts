import { makeSchema } from 'nexus';
import { join } from 'path';
import * as models from './models';
import { gql2sqlTypes } from 'gql2sql';

export const schema = makeSchema({
  types: [models, gql2sqlTypes],
  outputs: {
    typegen: join(__dirname, 'nexus-typegen.ts'),
  },
  contextType: {
    module: join(__dirname, "./context.ts"),
    export: "Context",
  },
});
