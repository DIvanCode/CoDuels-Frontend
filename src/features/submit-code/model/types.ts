export interface SubmitCodeRequestData {
    solution: string;
    language: string;
}

export interface SubmitCodeResponse {
    submission_id: string;
}

export type SubmissionStatus = "Queued" | "Running" | "Done";

export interface SubmissionItem {
    submission_id: string;
    status: SubmissionStatus;
    language: string;
    created_at: string;
    verdict?: string;
}

export interface SubmissionDetail extends SubmissionItem {
    solution: string;
    message?: string | null; // TODO: странное поведение, что message может быть null; дела бэка
}
