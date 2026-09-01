import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // display: headings and fighter names. ui: everything you read.
        // mono: notation, frame data, numbers - anything that should line up.
        display: ['"Ostrich Sans"', '"Haettenschweiler"', '"Arial Narrow"', "sans-serif"],
        ui: ['"Barlow Semi Condensed"', '"Helvetica Neue"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
