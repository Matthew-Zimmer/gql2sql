import { Injectable } from '@nestjs/common';
import { Ingredient } from './models/ingredient.model';
import { PrismaService } from '../prisma.service';
import { prepareSQLForQuery } from '../gql2sql';
import { GraphQLResolveInfo } from 'graphql';
import { Prisma } from '@prisma/client';
import { NewIngredientInput } from './dto/new-ingredient.input';

let count = 0;
@Injectable()
export class IngredientsService {
  constructor(private prisma: PrismaService) { }

  async select(info: GraphQLResolveInfo): Promise<any> {
    const query = prepareSQLForQuery(Prisma, info);
    console.log(query.text);
    const [{ root }] = await this.prisma.$queryRaw<[any]>(query);
    return root;
  }

  async create(data: NewIngredientInput): Promise<string> {
    const id = `${count++}`;
    await this.prisma.ingredient.create({
      data: {
        id,
        name: data.name,
        kind: data.kind,
      }
    });
    return id;
  }

  async findOneById(id: string): Promise<Ingredient> {
    return {} as any;
  }
}
