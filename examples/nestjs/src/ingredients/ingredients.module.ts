import { Module } from '@nestjs/common';
import { IngredientsResolver } from './ingredients.resolver';
import { IngredientsService } from './ingredients.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [IngredientsResolver, IngredientsService, PrismaService],
})
export class IngredientsModule { }
