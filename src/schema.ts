import { makeSchema } from 'nexus';
import { join } from 'path';
import * as models from './models';
import * as queries from './queries';
import * as utilTypes from './utils/nexusBuilder';

export const schema = makeSchema({
  types: [models, queries, utilTypes],
  outputs: {
    typegen: join(__dirname, 'nexus-typegen.ts'),
  },
  contextType: {
    module: join(__dirname, "./context.ts"),
    export: "Context",
  },
});
