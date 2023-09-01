import { spawn as spawnRaw, ChildProcess } from 'child_process';
import axios from 'axios';
import { inspect } from 'util';

let docker: ChildProcess;
let server: ChildProcess;

async function sleep(ms: number) {
  return new Promise<void>(f => setTimeout(() => f(), ms));
}

async function spawn(command: string, ...commands: string[]) {
  const p = spawnRaw(command, commands);
  p.on('message', x => console.log(x));
  return new Promise((res, rej) => {
    p.once('exit', () => res(p));
    p.once('error', (e) => rej(e));
  });
}

async function gql(query: string, variables: any = {}) {
  try {
    return await axios.post('http://localhost:3000/graphql', {
      query,
      variables,
    }).then(x => x.data);
  }
  catch (e: any) {
    console.error(inspect(e.response.data, false, null));
    throw e;
  }
}

async function matchGql(query: string, variables: any = {}) {
  expect(await gql(query, variables)).toMatchSnapshot();
}

// utils

// beforeAll(async () => {
//   docker = spawnRaw('docker', ['run', '-e', '-it', 'POSTGRES_USER=root', '-e', 'POSTGRES_PASSWORD=password', '-p', '5432:5432', 'postgres']);
//   await sleep(3000);
//   await spawn('npx', 'prisma', 'db', 'push');
//   await spawn('npx', 'prisma', 'db', 'seed');
//   server = spawnRaw('npm', ['start']);
//   server.on('message', x => console.log(x));
//   await sleep(3000);
// }, 20000);

// afterAll(() => {
//   if (server)
//     server.kill();
//   if (docker) {
//     docker.kill();
//   }
// });


// setup done

describe('Details Tests', () => {
  it('should get a column in the details from a collection', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
          }
        }
      }
    `);
  });

  it('should get multiple columns in the details from a collection', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            difficulty
          }
        }
      }
    `);
  });

  it('should get be able to skip a detail columns from a collection', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            difficulty @skip(if: true)
          }
        }
      }
    `);
  });
});

describe('Summary Tests', () => {
  it('should get a summary of column from a collection', async () => {
    await matchGql(`
      query {
        recipes {
          summary {
            title {
              count
            }
          }
        }
      }
    `);
  });

  it('should get a summary of column multi string aggregations from a collection', async () => {
    await matchGql(`
      query {
        recipes {
          summary {
            title {
              count
              countd
              distinct
              max
              min
            }
          }
        }
      }
    `);
  });

  it('should get a summary of total count from a collection', async () => {
    await matchGql(`
      query {
        recipes {
          summary {
            total {
              count
            }
          }
        }
      }
    `);
  });

  it('should get a summary of multi columns with multi aggregations from a collection', async () => {
    await matchGql(`
      query {
        recipes {
          summary {
            total {
              count
            }
            title {
              count
              max
              min
            }
          }
        }
      }
    `);
  });

  it('should get a summary of an enum columns over one value with many aggregations from a collection', async () => {
    await matchGql(`
      query {
        recipes {
          summary {
            difficulty {
              easy {
                total {
                  count
                }
                title {
                  min
                }
              }
            }
          }
        }
      }
    `);
  });

  it('should get a summary of an enum columns over all values with many aggregations from a collection', async () => {
    await matchGql(`
      query {
        recipes {
          summary {
            difficulty {
              easy {
                total {
                  count
                }
                title {
                  min
                }
              }
              medium {
                total {
                  count
                }
                title {
                  min
                }
              }
              hard {
                total {
                  count
                }
                title {
                  min
                }
              }
            }
          }
        }
      }
    `);
  });

  it('should get a summary of a nested column over one aggregation with many aggregations from a collection', async () => {
    await matchGql(`
      query {
        recipes {
          summary {
            ingredients {
              avg {
                total {
                  count
                }
              }
            }
          }
        }
      }
    `);
  });

  it('should get a summary of a nested column over multiple aggregations with many aggregations from a collection', async () => {
    await matchGql(`
      query {
        recipes {
          summary {
            ingredients {
              avg {
                total {
                  count
                }
              }
              std {
                total {
                  count
                }
              }
            }
          }
        }
      }
    `);
  });

  // TODO nest 2 layer nested summary
  // TODO nested summary with enum
  // TODO summary on an entity
});

describe('Relations Tests', () => {
  it('should be able to get related data', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            ingredients {
              details {
                id
              }
            }
          }
        }
      }
    `);
  });

  it('should be able to get multiple related data columns', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            title
            ingredients {
              details {
                id
                name
              }
            }
          }
        }
      }
    `);
  });

  it('should be able to get skip related data columns', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            title
            ingredients {
              details {
                id @skip(if: true)
                name
              }
            }
          }
        }
      }
    `);
  });

  it('should be able to get skip relations of a collection', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            title
            ingredients @skip(if: true) {
              details {
                id 
                name
              }
            }
          }
        }
      }
    `);
  });
});

describe('Variant Tests', () => {
  it('should be able to get base variant related data', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            ingredients {
              details {
                id
              }
            }
          }
        }
      }
    `);
  });

  it('should be able to get sum type of variant related data', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            ingredients {
              details {
                id
                ... on LiquidIngredient {
                  amount
                }
              }
            }
          }
        }
      }
    `);
  });

  it('should be able to get all sum types of a variant related data', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            ingredients {
              details {
                id
                ... on LiquidIngredient {
                  amount
                }
                ... on SolidIngredient {
                  quantity
                }
              }
            }
          }
        }
      }
    `);
  });

  it('should be able to get all sum types of a variant related data even if no values are requested of a sum type', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            ingredients {
              details {
                id
                ... on LiquidIngredient {
                  amount
                }
                ... on SolidIngredient {
                  __typename @skip(if: true)
                }
              }
            }
          }
        }
      }
    `);
  });
});

describe('Filter Tests', () => {
  it('should be able filter a detail field, string eq', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            title(eq: "recipe 1")
          }
        }
      }
    `);
  });

  it('should be able filter a detail field, string neq', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            title(neq: "recipe 1")
          }
        }
      }
    `);
  });

  it('should be able filter a detail field, string in', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            title(in: ["recipe 1", "recipe 3"])
          }
        }
      }
    `);
  });

  it('should be able filter a detail field, string notIn', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            title(notIn: ["recipe 1", "recipe 3"])
          }
        }
      }
    `);
  });

  it('should be able filter a detail field, string like', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            title(like: "recipe%")
          }
        }
      }
    `);
  });

  it('should be able filter a detail field, string not like', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            title(notLike: "recipe%")
          }
        }
      }
    `);
  });

  it('should be able filter a detail field, string not ilike', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            title(notiLike: "Recipe%")
          }
        }
      }
    `);
  });

  it('should be able filter a detail field, string ilike', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            title(ilike: "Recipe%")
          }
        }
      }
    `);
  });

  it('should be able filter a detail field, string isNull true', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            title(isNull: true)
          }
        }
      }
    `);
  });

  it('should be able filter a detail field, string isNull false', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            title(isNull: false)
          }
        }
      }
    `);
  });

  it('should be able filter a related detail field and filter the parent collection', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            ingredients {
              details {
                name(eq: "water")
              }
            }
          }
        }
      }
    `);
  });

  it('should be able filter a related detail field and not filter the parent collection', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            ingredients {
              details {
                name(eq: "water", opt: true)
              }
            }
          }
        }
      }
    `);
  });
});

describe('Sorting Tests', () => {
  it('should be able to sort on a detail field asc', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            title(sort: asc)
          }
        }
      }
    `);
  });

  it('should be able to sort on a detail field desc', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            title(sort: desc)
          }
        }
      }
    `);
  });

  it('should be able to sort on a related detail field asc', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            ingredients {
              details {
                name(sort: asc)
              }
            }
          }
        }
      }
    `);
  });

  it('should be able to sort on a related detail field desc', async () => {
    await matchGql(`
      query {
        recipes {
          details {
            id
            ingredients {
              details {
                name(sort: desc)
              }
            }
          }
        }
      }
    `);
  });
});



