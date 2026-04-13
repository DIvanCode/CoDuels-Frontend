import { ACTION_EVENT_TYPES, type ActionEventInput } from "../model/types";
import { pushActionEvent } from "./actionQueue";

type CommonActionPayload = {
    duel_id: number;
    user_id: number;
    task_key?: string;
};

const track = (payload: ActionEventInput) => {
    pushActionEvent(payload);
};

export const trackChooseLanguageAction = (payload: CommonActionPayload & { language: string }) => {
    track({
        ...payload,
        type: ACTION_EVENT_TYPES.CHOOSE_LANGUAGE,
    });
};

export const trackWriteCodeAction = (
    payload: CommonActionPayload & { code_length: number; cursor_line: number },
) => {
    track({
        ...payload,
        type: ACTION_EVENT_TYPES.WRITE_CODE,
    });
};

export const trackDeleteCodeAction = (
    payload: CommonActionPayload & { code_length: number; cursor_line: number },
) => {
    track({
        ...payload,
        type: ACTION_EVENT_TYPES.DELETE_CODE,
    });
};

export const trackPasteCodeAction = (
    payload: CommonActionPayload & {
        code_length: number;
        cursor_line: number;
        begin_line: number;
        end_line: number;
        chars_count: number;
    },
) => {
    track({
        ...payload,
        type: ACTION_EVENT_TYPES.PASTE_CODE,
    });
};

export const trackCutCodeAction = (
    payload: CommonActionPayload & {
        code_length: number;
        cursor_line: number;
        begin_line: number;
        end_line: number;
        chars_count: number;
    },
) => {
    track({
        ...payload,
        type: ACTION_EVENT_TYPES.CUT_CODE,
    });
};

export const trackMoveCursorAction = (
    payload: CommonActionPayload & {
        code_length: number;
        cursor_line: number;
        previous_cursor_line: number;
    },
) => {
    track({
        ...payload,
        type: ACTION_EVENT_TYPES.MOVE_CURSOR,
    });
};

export const trackRunSampleTestAction = (payload: CommonActionPayload) => {
    track({
        ...payload,
        type: ACTION_EVENT_TYPES.RUN_SAMPLE_TEST,
    });
};

export const trackRunCustomTestAction = (payload: CommonActionPayload) => {
    track({
        ...payload,
        type: ACTION_EVENT_TYPES.RUN_CUSTOM_TEST,
    });
};

export const trackSubmitSolutionAction = (payload: CommonActionPayload) => {
    track({
        ...payload,
        type: ACTION_EVENT_TYPES.SUBMIT_SOLUTION,
    });
};
