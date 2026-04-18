import { Infer, number, object, string } from "superstruct";
import { ApiLanguageValue } from "shared/config";

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

export type CodeRunStatus = "Queued" | "Running" | "Done";

export interface CreateCodeRunRequest {
    code: string;
    language: ApiLanguageValue;
    input: string;
}

export interface CodeRun {
    id: number;
    code: string;
    language: ApiLanguageValue;
    input: string;
    status: CodeRunStatus;
    output: string | null;
    error: string | null;
}
