import { Module } from '@nestjs/common';
import { DateScalar } from '../common/scalars/date.scalar';
import { RecipesResolver } from './recipes.resolver';
import { RecipesService } from './recipes.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [RecipesResolver, RecipesService, DateScalar, PrismaService],
})
export class RecipesModule { }
