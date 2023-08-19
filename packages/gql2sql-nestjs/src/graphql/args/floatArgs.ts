import { ArgsType, Field, Float } from '@nestjs/graphql';

@ArgsType()
export class FloatArgs {
  @Field(() => Float, { nullable: true })
  eq?: number;

  @Field(() => Float, { nullable: true })
  neq?: number;

  @Field(() => Float, { nullable: true })
  gt?: number;

  @Field(() => Float, { nullable: true })
  lt?: number;

  @Field(() => Float, { nullable: true })
  gteq?: number;

  @Field(() => Float, { nullable: true })
  lteq?: number;

  @Field(() => [Float], { nullable: true })
  in?: number[];

  @Field(() => [Float], { nullable: true })
  notIn?: number[];

  @Field(() => Boolean, { nullable: true })
  isNull?: boolean;

  @Field(() => Boolean, { nullable: true })
  isNotNull?: boolean;
}
