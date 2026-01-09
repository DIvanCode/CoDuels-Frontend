import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { apiSlice } from "shared/api";
import { StructError } from "superstruct";

import { Task, TaskResponse, TaskTopicsResponse, TestCase, TestCaseStruct } from "../model/types";

const buildTaskFileRequest = (taskId: string, filename: string) => ({
    url: `/task/${encodeURIComponent(taskId)}/${encodeURIComponent(filename)}`,
    responseHandler: "text" as const,
});

export const taskApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getTask: builder.query<TaskResponse, string>({
            query: (taskId: string) => `/task/${taskId}`,
        }),
        getTaskFile: builder.query<string, { taskId: string; filename: string }>({
            query: ({ taskId, filename }) => buildTaskFileRequest(taskId, filename),
        }),
        getTaskTests: builder.query<TestCase[], Task>({
            async queryFn({ id, tests }, _api, _extra, baseQuery) {
                try {
                    const data = await Promise.all(
                        tests.map(async ({ order, input, output }) => {
                            const [inputContent, outputContent] = await Promise.all([
                                baseQuery(buildTaskFileRequest(id, input)),
                                baseQuery(buildTaskFileRequest(id, output)),
                            ]);

                            // FetchBaseQueryError
                            if (inputContent.error) throw inputContent.error;
                            if (outputContent.error) throw outputContent.error;

                            const testCase: TestCase = TestCaseStruct.create(
                                {
                                    order,
                                    input: inputContent.data,
                                    output: outputContent.data,
                                },
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
        getTaskTopics: builder.query<TaskTopicsResponse, void>({
            query: () => "/task/topics",
        }),
    }),
});

export const { useGetTaskQuery, useGetTaskFileQuery, useGetTaskTestsQuery, useGetTaskTopicsQuery } =
    taskApiSlice;
