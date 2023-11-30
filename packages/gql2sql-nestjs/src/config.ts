import { DateTimeISOResolver } from "graphql-scalars";

export const nestjsGraphqlConfig = {
  resolvers: {
    DateTimeISO: DateTimeISOResolver,
  }
};
