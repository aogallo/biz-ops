import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  optimizeDeps: {
    include: ["lucide-react", "better-auth", "better-auth/adapters/drizzle"],
  },
  ssr: {
    noExternal: ["lucide-react", "better-auth", "better-auth/adapters/drizzle"],
  },
});
