import { PropsWithChildren } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Fallback } from "shared/ui";

export const Providers = ({ children }: PropsWithChildren) => {
    return <ErrorBoundary FallbackComponent={Fallback}>{children}</ErrorBoundary>;
};
