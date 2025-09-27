import { Outlet } from "react-router-dom";

export const Layout = () => {
    return (
        <div>
            <header>Header</header>
            <main>
                <Outlet />
            </main>
        </div>
    );
};
