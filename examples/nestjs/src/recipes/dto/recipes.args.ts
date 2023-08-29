import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Max, Min } from 'class-validator';

@ArgsType()
export class RecipesArgs {
  @Field(type => Int, { nullable: true })
  limit?: number;

  @Field(type => Int, { nullable: true })
  offset?: number;
}