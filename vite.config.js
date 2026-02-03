import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // Forward any request starting with /functions to your Supabase Edge Functions
      '/functions': {
        target: 'http://localhost:5000://vajtvjovnemjdgmcmioa.supabase.co',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/functions/, '/functions') // keep the path
      },
    },
  },
});
