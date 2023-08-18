import { CustomScalar, Scalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('Date', type => Date)
export class DateScalar implements CustomScalar<number, Date> {
  description = 'Date custom scalar type';

  parseValue(value: unknown): Date {
    if (typeof value !== 'number') throw '';
    return new Date(value); // value from the client
  }

  serialize(value: unknown): number {
    if (typeof value === 'string') value = new Date(value);
    if (!(value instanceof Date)) throw '';
    return value.getTime(); // value sent to the client
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.INT) {
      return new Date(ast.value);
    }
    console.log(ast);
    throw '';
  }
}