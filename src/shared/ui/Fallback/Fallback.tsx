import { AppRoutes } from "shared/config/routes/appRoutes";

export const Fallback = () => {
    return (
        <div role="alert" className="fallback">
            <h1>Something went wrong</h1>
            <a href={AppRoutes.INDEX}>Go to home page</a>
        </div>
    );
};
