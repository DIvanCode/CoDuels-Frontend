import store, { persistor } from "app/store";
import { PropsWithChildren } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Fallback } from "shared/ui";

export const Providers = ({ children }: PropsWithChildren) => {
    return (
        <ErrorBoundary FallbackComponent={Fallback}>
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                    {children}
                </PersistGate>
            </Provider>
        </ErrorBoundary>
    );
};
