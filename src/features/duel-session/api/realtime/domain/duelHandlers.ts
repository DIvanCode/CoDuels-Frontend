import { duelApiSlice, type Duel } from "entities/duel";
import { userApiSlice } from "entities/user";
import { fromApiLanguage } from "shared/config";

import {
    finishActiveDuel,
    setActiveDuel,
    setDuelCanceled,
    setDuelCanceledOpponentNickname,
    resetDuelSession,
} from "../../../model/duelSessionSlice";
import { buildDuelTaskKey, setOpponentCode } from "../codeEditorPort";
import type { RealtimeEventHandlers } from "../types";
import type { DomainEventContext } from "./context";
import { isCurrentDomainSession } from "./context";

const getTaskIdByKey = (duel: Duel, taskKey: string) => {
    if (duel.tasks) return duel.tasks[taskKey]?.id ?? null;
    if (duel.task_id && taskKey === "A") return duel.task_id;
    return null;
};

export const createDuelHandlers = (context: DomainEventContext): RealtimeEventHandlers => ({
    DuelStarted: [
        ({ payload }) => {
            if (!isCurrentDomainSession(context)) return;
            const activeDuelId = context.getState().duelSession.activeDuelId;

            context.dispatch(
                duelApiSlice.util.invalidateTags([{ type: "Duel", id: payload.duel_id }]),
            );

            if (activeDuelId && activeDuelId !== payload.duel_id) {
                context.reconcile();
                return;
            }

            context.dispatch(setActiveDuel({ duelId: payload.duel_id, userId: context.userId }));
        },
    ],
    DuelFinished: [
        ({ payload }) => {
            if (!isCurrentDomainSession(context)) return;
            const activeDuelId = context.getState().duelSession.activeDuelId;

            context.dispatch(
                duelApiSlice.util.invalidateTags([{ type: "Duel", id: payload.duel_id }]),
            );
            context.dispatch(userApiSlice.util.invalidateTags([{ type: "User", id: "ME" }]));

            if (activeDuelId === payload.duel_id) {
                context.dispatch(
                    finishActiveDuel({ duelId: payload.duel_id, userId: context.userId }),
                );
            }
        },
    ],
    DuelCanceled: [
        ({ payload }) => {
            if (!isCurrentDomainSession(context)) return;
            if (context.getState().duelSession.phase !== "searching") return;

            context.dispatch(resetDuelSession());
            context.dispatch(setDuelCanceledOpponentNickname(payload.opponent_nickname ?? null));
            context.dispatch(setDuelCanceled(true));
        },
    ],
    DuelChanged: [
        ({ payload }) => {
            if (!isCurrentDomainSession(context)) return;
            context.dispatch(
                duelApiSlice.util.invalidateTags([{ type: "Duel", id: payload.duel_id }]),
            );
        },
    ],
    OpponentSolutionUpdated: [
        ({ payload }) => {
            if (!isCurrentDomainSession(context)) return;
            const state = context.getState();
            const duel = duelApiSlice.endpoints.getDuel.select(payload.duel_id)(state)?.data;

            if (!duel) {
                context.dispatch(
                    duelApiSlice.util.invalidateTags([{ type: "Duel", id: payload.duel_id }]),
                );
                return;
            }
            if (!duel.should_show_opponent_solution) return;

            const taskId = getTaskIdByKey(duel, payload.task_key);
            if (!taskId) return;

            context.dispatch(
                setOpponentCode({
                    taskKey: buildDuelTaskKey(payload.duel_id, taskId),
                    code: payload.solution,
                    language: fromApiLanguage(payload.language),
                }),
            );
        },
    ],
});
