import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), svgr()],
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
