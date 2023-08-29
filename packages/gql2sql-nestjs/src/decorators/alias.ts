import { applyDecorators } from '@nestjs/common';
import { Extensions } from '@nestjs/graphql';
import { aliasExtensionName } from 'gql2sql';

/**
 * Attach an alias to this field the graphql schema will use the field name but will use `dbName` when making database queries * 
 * 
 * @param dbName The database name of the column this field represents
 */
export function Alias(dbName: string) {
  return applyDecorators(
    Extensions({
      [aliasExtensionName]: { name: dbName }
    })
  );
}
