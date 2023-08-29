import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class CollectionArgs {
  @Field(() => Int, { nullable: true, description: "Limits the number of rows to the provided value for a collection's details and summary to be based" })
  limit?: number;

  @Field(() => Int, { nullable: true, description: "Skips the provided value number of rows for a collection's details and summary to be based on" })
  offset?: number;
}
