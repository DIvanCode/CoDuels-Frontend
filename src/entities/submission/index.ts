export {
    submitCodeApiSlice,
    useGetSubmissionDetailQuery,
    useGetSubmissionsQuery,
    useSubmitCodeMutation,
} from "./api/submissionApi";

export type {
    SubmissionDetail,
    SubmissionItem,
    SubmissionStatus,
    SubmitCodeRequestData,
} from "./model/types";
export { isSubmissionStatusForward } from "./model/submissionStatus";
