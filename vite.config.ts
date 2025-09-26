import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: "127.0.0.1",
    },
    resolve: {
        alias: {
            app: "/src/app",
            entities: "/src/entities",
            features: "/src/features",
            pages: "/src/pages",
            shared: "/src/shared",
            widgets: "/src/widgets",
        },
    },
});
