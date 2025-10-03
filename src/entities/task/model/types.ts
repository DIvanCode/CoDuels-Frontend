import { Infer, number, object, string } from "superstruct";

export interface Task {
    id: string;
    name: string;
    level: number;
    statement: string;
    tl: number;
    ml: number;
    tests: Array<{
        order: number;
        inputFile: string;
        outputFile: string;
    }>;
}

export const TestCaseStruct = object({
    order: number(),
    input: string(),
    output: string(),
});

export type TestCase = Infer<typeof TestCaseStruct>;
