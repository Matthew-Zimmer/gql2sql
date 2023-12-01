import { applyDecorators } from '@nestjs/common';
import { Extensions } from '@nestjs/graphql';
import { distinctExtensionName } from 'gql2sql';

/**
 * Marks a table as having a distinct columns for grouping by subsets the table
 * 
 * @param dbNames The database names of the columns which form the subset
 */
export function Alias(...dbNames: string[]) {
  return applyDecorators(
    Extensions({
      [distinctExtensionName]: { columns: dbNames }
    })
  );
}
