interface SubmitCodeRequest {
    task_id: number;
    solution_id: number;
    solution: string;
    language: string;
}

interface SubmitCodeResponse {
    submission_id: number;
    status: string;
}
