import store from "app/store";
import { PropsWithChildren } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Provider } from "react-redux";
import { Fallback } from "shared/ui";

export const Providers = ({ children }: PropsWithChildren) => {
    return (
        <ErrorBoundary FallbackComponent={Fallback}>
            <Provider store={store}>{children}</Provider>
        </ErrorBoundary>
    );
};
