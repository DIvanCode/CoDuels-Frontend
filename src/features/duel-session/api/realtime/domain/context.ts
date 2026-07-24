export interface DomainEventContext {
    dispatch: AppDispatch;
    getState: () => RootState;
    userId: number;
    reconcile: () => void;
}

export const isCurrentDomainSession = (context: DomainEventContext) =>
    context.getState().auth.user?.id === context.userId;
