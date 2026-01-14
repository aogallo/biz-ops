import "dotenv/config";

import { defineConfig } from "drizzle-kit";

console.log("rul....", process.env.DATABASE_URL);

export default defineConfig({
  out: "./drizzle",
  schema: "./app/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
