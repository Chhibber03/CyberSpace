import { defineConfig } from "vite"

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: "index.html"
      }
    }
  },
  server: {
    port: 5173
  },
  define: {
    // Make environment variables available to the client
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify(process.env.VITE_BACKEND_URL),
    'import.meta.env.VITE_EXTENSION_DOWNLOAD_URL': JSON.stringify(process.env.VITE_EXTENSION_DOWNLOAD_URL)
  }
})
