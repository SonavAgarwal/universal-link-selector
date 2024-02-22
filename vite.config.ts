import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	build: {
		outDir: "extension",
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
				// popup: resolve(__dirname, "popup.html"),
				// options: resolve(__dirname, "options.html"),
			},
			output: {
				entryFileNames: "assets/[name].js",
				chunkFileNames: "assets/[name].js",
				assetFileNames: "assets/[name].[ext]",
			},
		},
	},
});
