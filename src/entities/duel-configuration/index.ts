export {
    useCreateDuelConfigurationMutation,
    useDeleteDuelConfigurationMutation,
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
