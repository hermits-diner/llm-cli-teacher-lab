import { NextResponse, type NextRequest } from "next/server";
import { getSql } from "@/lib/db";
import { TOOL_IDS, checkPublic, cleanNickname, sameSecret, vercelOrigin, type GalleryPost } from "@/lib/gallery";

const fail = (status: number, message: string) => NextResponse.json({ ok: false, message }, { status });

const isOpen = () => process.env.GALLERY_OPEN !== "false";
const codeRequired = () => Boolean(process.env.GALLERY_CODE);

export async function GET() {
  if (!process.env.DATABASE_URL) return fail(503, "갤러리 DB가 아직 연결되지 않았습니다.");
  try {
    const posts = (await getSql()`
      SELECT id, nickname, origin, tool, created_at
      FROM gallery_posts
      WHERE NOT hidden
      ORDER BY created_at DESC
      LIMIT 60`) as GalleryPost[];
    return NextResponse.json(
      { ok: true, open: isOpen(), codeRequired: codeRequired(), posts },
      { headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10" } },
    );
  } catch {
    return fail(503, "갤러리 DB에 연결할 수 없습니다. 잠시 뒤 다시 시도하세요.");
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.DATABASE_URL) return fail(503, "갤러리 DB가 아직 연결되지 않았습니다.");
  if (!isOpen()) return fail(403, "지금은 갤러리 등록을 받지 않습니다.");

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return fail(400, "보낸 내용을 읽을 수 없습니다.");

  if (codeRequired()) {
    const code = typeof body.code === "string" ? body.code.trim().toLowerCase() : null;
    if (!sameSecret(code, process.env.GALLERY_CODE?.trim().toLowerCase())) {
      return fail(403, "참여 코드가 맞지 않습니다. 강사가 알려 준 코드를 입력하세요.");
    }
  }
  const nickname = cleanNickname(body.nickname);
  if (!nickname) return fail(400, "닉네임을 1~20자로 적어 주세요.");
  const origin = vercelOrigin(body.url);
  if (!origin) return fail(400, "https://이름.vercel.app 형태의 Vercel 주소만 올릴 수 있습니다.");
  const tool = TOOL_IDS.find((t) => t === body.tool);
  if (!tool) return fail(400, "도구를 골라 주세요.");

  const status = await checkPublic(origin);
  if (status === "private") {
    return fail(400, "다른 사람은 열 수 없는 주소입니다. Vercel 프로젝트 화면의 Visit 버튼으로 연 짧은 주소를 올려 주세요.");
  }
  if (status === "missing") return fail(400, "그 주소에 사이트가 없습니다. 주소를 다시 확인하세요.");
  if (status === "unreachable") return fail(400, "사이트에 접속할 수 없습니다. 주소를 다시 확인하세요.");

  try {
    const [post] = (await getSql()`
      INSERT INTO gallery_posts (nickname, origin, tool)
      VALUES (${nickname}, ${origin}, ${tool})
      ON CONFLICT (origin) DO NOTHING
      RETURNING id, nickname, origin, tool, created_at`) as GalleryPost[];
    if (!post) return fail(409, "이미 갤러리에 올라간 주소입니다.");
    return NextResponse.json({ ok: true, post }, { status: 201 });
  } catch {
    return fail(503, "갤러리 DB에 저장하지 못했습니다. 잠시 뒤 다시 시도하세요.");
  }
}

// Instructor only: hide a post from the shared screen (never deleted).
export async function PATCH(req: NextRequest) {
  if (!process.env.DATABASE_URL) return fail(503, "갤러리 DB가 아직 연결되지 않았습니다.");
  if (!sameSecret(req.headers.get("x-admin-key"), process.env.GALLERY_ADMIN_KEY)) {
    return fail(401, "관리 키가 맞지 않습니다.");
  }
  const body = await req.json().catch(() => null);
  const id = Number(body?.id);
  if (!Number.isSafeInteger(id) || id <= 0) return fail(400, "숨길 글을 찾을 수 없습니다.");
  const hidden = body?.hidden !== false;
  await getSql()`UPDATE gallery_posts SET hidden = ${hidden} WHERE id = ${id}`;
  return NextResponse.json({ ok: true, id, hidden });
}
