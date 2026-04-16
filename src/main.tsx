import App from "app/App";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "shared/lib/polyfills/cryptoRandomUUID";

import "./index.css";

async function start() {
    const root = createRoot(document.querySelector("#root")!);

    root.render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
}

start();
