import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "tailwindcss";

const DEFAULT_GA_MEASUREMENT_ID = "G-8R4G06KBTN";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const gaMeasurementId =
    env.VITE_GA_MEASUREMENT_ID || DEFAULT_GA_MEASUREMENT_ID;

  return {
    plugins: [
      react(),
      {
        name: "inject-ga-measurement-id",
        transformIndexHtml(html) {
          return html.replaceAll(DEFAULT_GA_MEASUREMENT_ID, gaMeasurementId);
        },
      },
    ],
    css: {
      postcss: {
        plugins: [tailwindcss()],
      },
    },
  };
});
