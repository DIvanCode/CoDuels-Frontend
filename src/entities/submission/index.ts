export {
    submitCodeApiSlice,
    useGetSubmissionDetailQuery,
    useGetSubmissionsQuery,
    useSubmitCodeMutation,
    useGetAdminTestingSubmissionsQuery,
    useGetAdminSubmissionsQuery,
} from "./api/submissionApi";

export type {
    SubmissionDetail,
    SubmissionItem,
    SubmissionStatus,
    SubmitCodeRequestData,
} from "./model/types";
export { isSubmissionStatusForward } from "./model/submissionStatus";
