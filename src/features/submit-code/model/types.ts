import type { ApiLanguageValue } from "shared/config";

export interface SubmitCodeRequestData {
    solution: string;
    language: ApiLanguageValue;
    task_key: string;
}

export type SubmissionStatus = "Queued" | "Running" | "Done";

export interface SubmissionItem {
    submission_id: number;
    status: SubmissionStatus;
    language: ApiLanguageValue;
    created_at: string;
    verdict?: string | null;
    is_upsolving: boolean;
}

export interface SubmissionDetail {
    id: number;
    solution: string | null;
    language: ApiLanguageValue;
    status: SubmissionStatus;
    created_at: string;
    message?: string | null;
    verdict?: string | null;
    is_upsolving: boolean;
}
