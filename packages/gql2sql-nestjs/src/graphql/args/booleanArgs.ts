import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class BooleanArgs {
  @Field(() => Boolean, { nullable: true })
  eq?: boolean;

  @Field(() => Boolean, { nullable: true })
  neq?: boolean;

  @Field(() => [Boolean], { nullable: true })
  in?: boolean[];

  @Field(() => [Boolean], { nullable: true })
  notIn?: boolean[];

  @Field(() => Boolean, { nullable: true })
  isNull?: boolean;

  @Field(() => Boolean, { nullable: true })
  isNotNull?: boolean;
}
