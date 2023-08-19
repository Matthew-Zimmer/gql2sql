import { ArgsType, Field, ID } from '@nestjs/graphql';

@ArgsType()
export class IDArgs {
  @Field(() => ID, { nullable: true })
  eq?: string;

  @Field(() => ID, { nullable: true })
  neq?: string;

  @Field(() => [ID], { nullable: true })
  in?: string[];

  @Field(() => [ID], { nullable: true })
  notIn?: string[];

  @Field(() => Boolean, { nullable: true })
  isNull?: boolean;

  @Field(() => Boolean, { nullable: true })
  isNotNull?: boolean;
}
