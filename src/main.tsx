import { worker } from "app/api/server";
import App from "app/App";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

async function start() {
    await worker.start({ onUnhandledRequest: "bypass" });

    const container = document.querySelector("#root") as HTMLElement;
    const root = createRoot(container);

    root.render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
}

start();
