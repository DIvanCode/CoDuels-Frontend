export interface SubmitCodeRequestData {
    solution: string;
    language: string;
}

export interface SubmitCodeResponse {
    submission_id: string;
    status: string;
}

export interface SubmissionItem {
    submission_id: string;
    status: string;
    verdict?: string;
    created_at: string;
}

export interface SubmissionDetail {
    submission_id: string;
    solution: string;
    language: string;
    status: string;
    verdict?: string;
    created_at: string;
}
