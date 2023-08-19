import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class IntArgs {
  @Field(() => Int, { nullable: true })
  eq?: number;

  @Field(() => Int, { nullable: true })
  neq?: number;

  @Field(() => Int, { nullable: true })
  gt?: number;

  @Field(() => Int, { nullable: true })
  lt?: number;

  @Field(() => Int, { nullable: true })
  gteq?: number;

  @Field(() => Int, { nullable: true })
  lteq?: number;

  @Field(() => [Int], { nullable: true })
  in?: number[];

  @Field(() => [Int], { nullable: true })
  notIn?: number[];

  @Field(() => Boolean, { nullable: true })
  isNull?: boolean;

  @Field(() => Boolean, { nullable: true })
  isNotNull?: boolean;
}
