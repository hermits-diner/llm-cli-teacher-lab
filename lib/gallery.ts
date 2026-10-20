import { timingSafeEqual } from "node:crypto";

export const TOOL_IDS = ["agy", "codex", "claude"] as const;

export type GalleryPost = {
  id: number;
  nickname: string;
  origin: string;
  tool: (typeof TOOL_IDS)[number];
  created_at: string;
};

// Strip control, zero-width and bidi-override characters so a nickname cannot
// hide or reorder text on the shared screen.
export function cleanNickname(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw
    .normalize("NFC")
    .replace(/[\p{Cc}\p{Cf}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  const length = [...name].length;
  return length >= 1 && length <= 20 ? name : null;
}

// Only https://<name>.netlify.app is accepted; returns the origin to store.
export function netlifyOrigin(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let text = raw.trim();
  if (!/^[a-z]+:\/\//i.test(text)) text = `https://${text}`;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase();
  if (!/^[a-z0-9-]+\.netlify\.app$/.test(host)) return null;
  return `https://${host}`;
}

// The page must be reachable and public; Netlify answers 401/403 for private sites.
export async function checkPublic(origin: string): Promise<"ok" | "private" | "missing" | "unreachable"> {
  try {
    const res = await fetch(origin, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(3000) });
    if (res.status === 401 || res.status === 403) return "private";
    if (res.status === 404) return "missing";
    return res.status < 400 ? "ok" : "unreachable";
  } catch {
    return "unreachable";
  }
}

export function sameSecret(given: string | null, expected: string | undefined): boolean {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
