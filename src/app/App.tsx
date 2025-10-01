import { DuelSessionManager } from "features/duel-session";

import { Providers } from "./providers";
import { AppRouter } from "./router";

import "./styles/index.scss";

function App() {
    return (
        <Providers>
            <DuelSessionManager />
            <AppRouter />
        </Providers>
    );
}

export default App;
