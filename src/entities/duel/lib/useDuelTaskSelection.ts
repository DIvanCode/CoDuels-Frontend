import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { Duel } from "../model/types";

const TASK_QUERY_PARAM = "task";

export interface DuelTaskOption {
    key: string;
    id: string | null;
}

const getDuelTaskOptions = (duel?: Duel): DuelTaskOption[] => {
    if (duel?.tasks && Object.keys(duel.tasks).length > 0) {
        return Object.entries(duel.tasks)
            .map(([key, value]) => ({ key, id: value.id }))
            .sort((a, b) => a.key.localeCompare(b.key));
    }

    if (duel?.task_id) {
        return [{ key: "A", id: duel.task_id }];
    }

    return [];
};

export const useDuelTaskSelection = (duel?: Duel) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const tasks = useMemo(() => getDuelTaskOptions(duel), [duel]);
    const taskKeys = useMemo(() => new Set(tasks.map((task) => task.key)), [tasks]);

    const selectedKeyFromQuery = searchParams.get(TASK_QUERY_PARAM) ?? "";
    const selectedTaskKey = taskKeys.has(selectedKeyFromQuery)
        ? selectedKeyFromQuery
        : (tasks[0]?.key ?? "");
    const selectedTaskId = tasks.find((task) => task.key === selectedTaskKey)?.id ?? null;

    useEffect(() => {
        if (!selectedTaskKey) return;
        if (selectedKeyFromQuery === selectedTaskKey) return;

        const nextParams = new URLSearchParams(searchParams);
        nextParams.set(TASK_QUERY_PARAM, selectedTaskKey);
        setSearchParams(nextParams, { replace: true });
    }, [searchParams, selectedKeyFromQuery, selectedTaskKey, setSearchParams]);

    const setSelectedTaskKey = (key: string) => {
        if (!taskKeys.has(key)) return;

        const nextParams = new URLSearchParams(searchParams);
        nextParams.set(TASK_QUERY_PARAM, key);
        setSearchParams(nextParams);
    };

    return {
        tasks,
        selectedTaskKey: selectedTaskKey || null,
        selectedTaskId,
        setSelectedTaskKey,
    };
};
