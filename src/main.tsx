import App from "app/App";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

async function start() {
    // await worker.start({ onUnhandledRequest: "bypass" });

    const root = createRoot(document.querySelector("#root")!);

    root.render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
}

start();
