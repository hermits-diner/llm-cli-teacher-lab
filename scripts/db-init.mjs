// Create the gallery table once (safe to re-run).
//   vercel env pull .env.local --yes
//   node --env-file=.env.local scripts/db-init.mjs
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Run: vercel env pull .env.local --yes");
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS gallery_posts (
    id          BIGSERIAL PRIMARY KEY,
    nickname    TEXT NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 20),
    origin      TEXT NOT NULL UNIQUE,
    tool        TEXT NOT NULL CHECK (tool IN ('agy', 'codex', 'claude')),
    hidden      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
await sql`CREATE INDEX IF NOT EXISTS gallery_posts_recent ON gallery_posts (created_at DESC) WHERE NOT hidden`;
const [{ count }] = await sql`SELECT count(*)::int AS count FROM gallery_posts`;
console.log(`gallery_posts ready (${count} rows)`);
