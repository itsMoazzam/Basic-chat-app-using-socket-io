// Vite configuration - Build tool setup for React development
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Define Vite configuration
export default defineConfig({
    // Use React plugin for JSX transformation
    plugins: [react()],

    server: {
        port: 3000,
        host: "0.0.0.0",
        open: true,
        proxy: {
            "/api": { target: "http://localhost:5000", changeOrigin: true },
            "/socket.io": { target: "http://localhost:5000", ws: true },
        },
    },

    // Build configuration
    build: {
        // Output directory for built files
        outDir: "dist",
        // Minify output code
        minify: "terser",
    },
});
