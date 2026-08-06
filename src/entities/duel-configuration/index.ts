export {
    useCreateDuelConfigurationMutation,
    useDeleteDuelConfigurationMutation,
    useGetDuelConfigurationsQuery,
    useGetDuelConfigurationQuery,
    useGetTaskLevelRatingRangesQuery,
    useUpdateDuelConfigurationMutation,
} from "./api/duelConfigurationApi";

export type {
    CreateDuelConfigurationRequest,
    DuelConfiguration,
    DuelTaskConfiguration,
    DuelTasksOrder,
    TaskLevelRatingRanges,
    UpdateDuelConfigurationRequest,
} from "./model/types";
