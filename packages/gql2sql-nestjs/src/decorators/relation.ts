import { applyDecorators } from '@nestjs/common';
import { Extensions } from '@nestjs/graphql';
import { relationExtensionName } from 'gql2sql';
import { Decorator } from './types';

/**
 * Marks a field as being sourced from a related table instead of collection table
 * 
 * @param parentId The column name on the current table to join from
 * @param to The name of the related table
 * @param childId The column name on the related table to join to
 */
export function Relation(parentId: string, to: string, childId: string): Decorator;

/**
 * Marks a field as being sourced from a related table instead of collection table with a mapping table in between the two
 * 
 * @param parentId The column name on the current table to join from
 * @param mapping The name of the mapping table to relate to
 * @param mappingParentId The column name of current table to join to on the mapping table
 * @param mappingChildId The column name of related table to join to from the mapping table
 * @param to The name of the related table
 * @param childId The column name on the related table to join to
 */
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
