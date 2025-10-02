import { apiSlice } from "shared/api";

import { Task } from "../model/types";

export const taskApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getTask: builder.query<Task, string>({
            query: (taskId: string) => `/task/${taskId}`,
        }),
        getTaskFile: builder.query<string, { taskId: string; filename: string }>({
            query: ({ taskId, filename }) => {
                return {
                    url: `/task/${encodeURIComponent(taskId)}/${encodeURIComponent(filename)}`,
                    responseHandler: "text",
                };
            },
        }),
    }),
});

export const { useGetTaskQuery, useGetTaskFileQuery } = taskApiSlice;
