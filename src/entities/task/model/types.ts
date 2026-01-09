import { Infer, number, object, string } from "superstruct";

export interface Task {
    id: string;
    title: string;
    type: "write_code";
    statement: string;
    tl: number;
    ml: number;
    tests: TestCase[];
}

export interface TaskResponse {
    status: "OK" | "Error";
    task?: Task;
    error?: string;
}

export interface TaskTopicsResponse {
    status: "OK" | "Error";
    topics?: string[];
    error?: string;
}

export const TestCaseStruct = object({
    order: number(),
    input: string(),
    output: string(),
});

export type TestCase = Infer<typeof TestCaseStruct>;
