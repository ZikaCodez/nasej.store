import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_API_URL || "";
  const devPort = 5000;

  // Avoid proxying to the same origin as the dev server (prevents loops)
  let proxy: Record<string, any> | undefined = {
    // Proxy API/auth requests to the backend when it's on a different origin
    "^/(auth|api)": {
      target: apiUrl,
      changeOrigin: true,
      secure: apiUrl.startsWith("https"),
    },
  };
  try {
    const u = new URL(apiUrl);
    const isLocalHost = ["localhost", "127.0.0.1"].includes(u.hostname);
    const portMatches =
      Number(u.port || (u.protocol === "https:" ? 443 : 80)) === devPort;
    if (isLocalHost && portMatches) {
      // Backend equals dev server origin; let requests hit dev server directly
      proxy = undefined;
    }
  } catch {}

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5000,
      proxy,
    },
  };
});
