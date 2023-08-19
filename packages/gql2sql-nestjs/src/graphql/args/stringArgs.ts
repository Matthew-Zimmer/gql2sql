import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class StringArgs {
  @Field(() => String, { nullable: true })
  eq?: string;

  @Field(() => String, { nullable: true })
  neq?: string;

  @Field(() => String, { nullable: true })
  like?: string;

  @Field(() => String, { nullable: true })
  notLike?: string;

  @Field(() => String, { nullable: true })
  ilike?: string;

  @Field(() => String, { nullable: true })
  notiLike?: string;

  @Field(() => [String], { nullable: true })
  in?: string[];

  @Field(() => [String], { nullable: true })
  notIn?: string[];

  @Field(() => Boolean, { nullable: true })
  isNull?: boolean;

  @Field(() => Boolean, { nullable: true })
  isNotNull?: boolean;
}
