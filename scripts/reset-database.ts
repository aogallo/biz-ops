// path to a file with schema you want to reset
import { reset } from "drizzle-seed";
import { db } from "../app/server/db/index.ts";
import { schema } from "../app/server/db/schema.ts";

async function main() {
  await reset(db, schema);
}

main();
