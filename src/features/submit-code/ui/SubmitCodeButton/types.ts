export interface SubmitCodeRequestData {
    solution: string;
    language: string;
}

export interface SubmitCodeResponse {
    submission_id: string;
}

// TODO: блять, там submit_time, тут created_at вы там с дуба ебнулись или где
// это просто полный пиздец у меня так горит нахуй
// какого хуя тут нет language, почему просто почему нахуууууууууууй
export interface SubmissionItem {
    submission_id: string;
    status: string;
    verdict?: string;
    created_at: string;
}

export interface SubmissionDetail {
    submission_id: string;
    status: "Queued" | "Running" | "Done";
    verdict?: string;
    solution: string;
    language: string;
    submit_time: string;
    message?: string | null;
}
