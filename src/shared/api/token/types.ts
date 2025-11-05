import { Infer, object, string } from "superstruct";

export const TokenPairStruct = object({
    access_token: string(),
    refresh_token: string(),
});

export type TokenPair = Infer<typeof TokenPairStruct>;
