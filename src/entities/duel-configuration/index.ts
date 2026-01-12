export {
    useCreateDuelConfigurationMutation,
    useDeleteDuelConfigurationMutation,
    useGetDuelConfigurationsQuery,
    useGetDuelConfigurationQuery,
    useUpdateDuelConfigurationMutation,
} from "./api/duelConfigurationApi";

export type {
    CreateDuelConfigurationRequest,
    DuelConfiguration,
    DuelTaskConfiguration,
    DuelTasksOrder,
    UpdateDuelConfigurationRequest,
} from "./model/types";
