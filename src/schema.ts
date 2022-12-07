import { makeSchema } from 'nexus';
import { join } from 'path';
import * as models from './models';
import * as queries from './queries';

export const schema = makeSchema({
  types: [models, queries],
  outputs: {
    typegen: join(__dirname, 'nexus-typegen.ts'),
  },
  contextType: {                                    // 1
    module: join(__dirname, "./context.ts"),        // 2
    export: "Context",                              // 3
  },
});
