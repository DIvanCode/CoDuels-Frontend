import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { apiSlice } from "shared/api";
import { StructError, create } from "superstruct";

import { Task, TestCase, TestCaseStruct } from "../model/types";

const buildTaskFileRequest = (taskId: string, filename: string) => ({
    url: `/task/${encodeURIComponent(taskId)}/${encodeURIComponent(filename)}`,
    responseHandler: "text" as const,
});

export const taskApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getTask: builder.query<Task, string>({
            query: (taskId: string) => `/task/${taskId}`,
        }),
        getTaskFile: builder.query<string, { taskId: string; filename: string }>({
            query: ({ taskId, filename }) => buildTaskFileRequest(taskId, filename),
        }),
        getTaskTests: builder.query<TestCase[], Task>({
            async queryFn({ id, tests }, _api, _extra, baseQuery) {
                try {
                    const data = await Promise.all(
                        tests.map(async ({ order, inputFile, outputFile }) => {
                            const [input, output] = await Promise.all([
                                baseQuery(buildTaskFileRequest(id, inputFile)),
                                baseQuery(buildTaskFileRequest(id, outputFile)),
                            ]);

                            // FetchBaseQueryError
                            if (input.error) throw input.error;
                            if (output.error) throw output.error;

                            const testCase: TestCase = create(
                                {
                                    order,
                                    input: input.data,
                                    output: output.data,
                                },
                                TestCaseStruct,
                                `Unable to parse test case #${order}`,
                            );

                            return testCase;
                        }),
                    );

                    return { data };
                } catch (err) {
                    if (err instanceof StructError) {
                        return { error: { status: 400, data: err.message } };
                    }
                    return { error: err as FetchBaseQueryError };
                }
            },
        }),
    }),
});

export const { useGetTaskQuery, useGetTaskFileQuery, useGetTaskTestsQuery } = taskApiSlice;
