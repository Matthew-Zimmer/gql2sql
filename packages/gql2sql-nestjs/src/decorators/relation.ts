import { applyDecorators } from '@nestjs/common';
import { Extensions } from '@nestjs/graphql';
import { relationExtensionName } from 'gql2sql';
import { Decorator } from './types';

export function Relation(parentId: string, to: string, childId: string): Decorator;
export function Relation(parentId: string, mapping: string, mappingParentId: string, mappingChildId: string, to: string, childId: string): Decorator;
export function Relation(...args: string[]) {
  return applyDecorators(
    Extensions({
      [relationExtensionName]: args.length === 3 ?
        [{ parentId: args[0], to: args[1], childId: args[2] }] :
        [{ parentId: args[0], to: args[1], childId: args[2] }, { parentId: args[3], to: args[4], childId: args[5] }]
    })
  );
}
