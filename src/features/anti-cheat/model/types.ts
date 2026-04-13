export const ACTION_EVENT_TYPES = {
    CHOOSE_LANGUAGE: "ChooseLanguage",
    WRITE_CODE: "WriteCode",
    DELETE_CODE: "DeleteCode",
    PASTE_CODE: "PasteCode",
    CUT_CODE: "CutCode",
    MOVE_CURSOR: "MoveCursor",
    RUN_SAMPLE_TEST: "RunSampleTest",
    RUN_CUSTOM_TEST: "RunCustomTest",
    SUBMIT_SOLUTION: "SubmitSolution",
} as const;

export type ActionEventType = (typeof ACTION_EVENT_TYPES)[keyof typeof ACTION_EVENT_TYPES];

interface ActionEventBase {
    event_id: string;
    sequence_id: number;
    timestamp: string;
    duel_id: number;
    user_id: number;
    type: ActionEventType;
    task_key?: string;
}

export interface ChooseLanguageActionEvent extends ActionEventBase {
    type: "ChooseLanguage";
    language: string;
}

interface CodeEventBase extends ActionEventBase {
    code_length: number;
    cursor_line: number;
}

export interface WriteCodeActionEvent extends CodeEventBase {
    type: "WriteCode";
}

export interface DeleteCodeActionEvent extends CodeEventBase {
    type: "DeleteCode";
}

interface ClipboardCodeEventBase extends CodeEventBase {
    begin_line: number;
    end_line: number;
    chars_count: number;
}

export interface PasteCodeActionEvent extends ClipboardCodeEventBase {
    type: "PasteCode";
}

export interface CutCodeActionEvent extends ClipboardCodeEventBase {
    type: "CutCode";
}

export interface MoveCursorActionEvent extends CodeEventBase {
    type: "MoveCursor";
    previous_cursor_line: number;
}

export interface RunSampleTestActionEvent extends ActionEventBase {
    type: "RunSampleTest";
}

export interface RunCustomTestActionEvent extends ActionEventBase {
    type: "RunCustomTest";
}

export interface SubmitSolutionActionEvent extends ActionEventBase {
    type: "SubmitSolution";
}

export type ActionEvent =
    | ChooseLanguageActionEvent
    | WriteCodeActionEvent
    | DeleteCodeActionEvent
    | PasteCodeActionEvent
    | CutCodeActionEvent
    | MoveCursorActionEvent
    | RunSampleTestActionEvent
    | RunCustomTestActionEvent
    | SubmitSolutionActionEvent;

export type ActionEventInput = Omit<ActionEvent, "event_id" | "sequence_id" | "timestamp">;
