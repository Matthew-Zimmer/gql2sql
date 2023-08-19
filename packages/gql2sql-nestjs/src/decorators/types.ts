import { applyDecorators } from "@nestjs/common";

export type Decorator = ReturnType<typeof applyDecorators>;
