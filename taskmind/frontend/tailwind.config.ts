import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        critica: "#ef4444",
        alta: "#f97316",
        media: "#eab308",
        baixa: "#22c55e",
      },
    },
  },
  plugins: [],
};

export default config;
