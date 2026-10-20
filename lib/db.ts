import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sql: NeonQueryFunction<false, false> | null = null;

// Created on first use so `next build` works before DATABASE_URL is provisioned.
export function getSql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  sql ??= neon(process.env.DATABASE_URL);
  return sql;
}
