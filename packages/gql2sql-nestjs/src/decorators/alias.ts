import { applyDecorators } from '@nestjs/common';
import { Extensions } from '@nestjs/graphql';
import { aliasExtensionName } from 'gql2sql';

export function Alias(name: string) {
  return applyDecorators(
    Extensions({
      [aliasExtensionName]: { name }
    })
  );
}
