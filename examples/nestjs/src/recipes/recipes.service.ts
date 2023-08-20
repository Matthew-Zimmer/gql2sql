import { Injectable } from '@nestjs/common';
import { NewRecipeInput } from './dto/new-recipe.input';
import { RecipesArgs } from './dto/recipes.args';
import { Recipe } from './models/recipe.model';
import { PrismaService } from '../prisma.service';
import { generateFieldFromQuery, prepareSQLForQuery } from 'gql2sql';
import { GraphQLResolveInfo } from 'graphql';
import { Prisma } from '@prisma/client';
import { inspect } from 'util';

let count = 0;

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) { }

  async select(info: GraphQLResolveInfo): Promise<any> {
    const field = generateFieldFromQuery(info);

    console.log(inspect(field, false, null, true));


    const query = prepareSQLForQuery(Prisma, info);
    //console.log(query.text);
    const [{ root }] = await this.prisma.$queryRaw<[any]>(query);
    return root;
  }

  async create(data: NewRecipeInput): Promise<string> {
    const id = `${count++}`;
    await this.prisma.recipe.create({
      data: {
        id,
        creationDate: new Date(),
        description: data.description,
        title: data.title,
      },
    });
    return id;
  }

  async findOneById(id: string): Promise<Recipe> {
    return {} as any;
  }

  async remove(id: string): Promise<boolean> {
    return true;
  }
}
