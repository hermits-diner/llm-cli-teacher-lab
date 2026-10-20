"use client";

import { useCallback, useEffect, useState } from "react";
import { TOOLS, type ToolId } from "@/lib/site";
import type { GalleryPost } from "@/lib/gallery";

type State = { ok: true; open: boolean; codeRequired: boolean; posts: GalleryPost[] } | { ok: false; message: string };

const ADMIN_KEY = "ai-lab-gallery-admin";
const toolName = (id: string) => TOOLS.find((t) => t.id === id)?.name ?? id;

function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}시간 전` : new Date(iso).toLocaleDateString("ko-KR");
}

export function GalleryBoard({ backupUrl }: { backupUrl?: string }) {
  const [state, setState] = useState<State | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [admin, setAdmin] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/gallery", { cache: "no-store" });
      setState(await res.json());
    } catch {
      setState({ ok: false, message: "갤러리를 불러오지 못했습니다. 인터넷 연결을 확인하세요." });
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10_000);
    if (new URLSearchParams(location.search).has("admin")) {
      setAdminMode(true);
      setAdmin(sessionStorage.getItem(ADMIN_KEY));
    }
    return () => clearInterval(timer);
  }, [load]);

  async function hide(id: number) {
    if (!admin) return;
    const res = await fetch("/api/gallery", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": admin },
      body: JSON.stringify({ id, hidden: true }),
    });
    if (res.ok) {
      sessionStorage.setItem(ADMIN_KEY, admin);
      load();
    } else {
      sessionStorage.removeItem(ADMIN_KEY);
      setAdmin(null);
    }
  }

  if (!state) return <p className="gallery__status">불러오는 중…</p>;
  if (!state.ok)
    return (
      <div className="callout callout--warn">
        <p className="callout__title">갤러리를 쓸 수 없습니다</p>
        <p>{state.message}</p>
        {backupUrl && (
          <p>
            대신 <a href={backupUrl}>예비 게시판</a>에 주소를 올려 주세요.
          </p>
        )}
      </div>
    );

  return (
    <>
      {adminMode && !admin && (
        <form
          className="gallery-admin"
          onSubmit={(e) => {
            e.preventDefault();
            const key = String(new FormData(e.currentTarget).get("key") ?? "").trim();
            if (key) setAdmin(key);
          }}
        >
          <label>
            강사용 관리 키
            <input name="key" type="password" autoComplete="off" />
          </label>
          <button type="submit" className="button button--quiet">
            숨기기 버튼 켜기
          </button>
        </form>
      )}
      {state.open ? (
        <GalleryForm codeRequired={state.codeRequired} onPosted={load} />
      ) : (
        <p className="gallery__status">지금은 등록을 받지 않습니다. 올라온 페이지를 구경해 보세요.</p>
      )}

      <h2>
        올라온 페이지 <span className="gallery__count">{state.posts.length}개</span>
      </h2>
      {state.posts.length === 0 ? (
        <p className="gallery__status">아직 올라온 페이지가 없습니다. 첫 번째로 올려 보세요.</p>
      ) : (
        <ul className="gallery">
          {state.posts.map((p) => (
            <li key={p.id} className="gallery__item">
              <a href={p.origin} target="_blank" rel="noopener noreferrer nofollow ugc" className="gallery__link">
                <span className="gallery__nick">{p.nickname}</span>
                <span className="gallery__host">{p.origin.replace("https://", "")}</span>
              </a>
              <span className="gallery__meta">
                {toolName(p.tool)}, {timeAgo(p.created_at)}
              </span>
              {admin && (
                <button type="button" className="gallery__hide" onClick={() => hide(p.id)}>
                  숨기기
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function GalleryForm({ codeRequired, onPosted }: { codeRequired: boolean; onPosted: () => void }) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [tool, setTool] = useState<ToolId>("agy");

  useEffect(() => {
    setTool((document.documentElement.dataset.tool as ToolId) || "agy");
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ ok: true, text: "갤러리에 올렸습니다." });
        (e.target as HTMLFormElement).reset();
        onPosted();
      } else setMessage({ ok: false, text: data.message });
    } catch {
      setMessage({ ok: false, text: "보내지 못했습니다. 인터넷 연결을 확인하세요." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="gallery-form" onSubmit={submit}>
      <label>
        닉네임
        <input name="nickname" required maxLength={20} placeholder="예: 과학쌤" autoComplete="off" />
      </label>
      <label>
        내 페이지 주소
        <input name="url" required inputMode="url" placeholder="https://our-class.netlify.app" autoComplete="off" />
      </label>
      <label>
        쓴 도구
        <select name="tool" value={tool} onChange={(e) => setTool(e.target.value as ToolId)}>
          {TOOLS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      {codeRequired && (
        <label>
          참여 코드
          <input name="code" required placeholder="강사가 알려 준 코드" autoComplete="off" />
        </label>
      )}
      <button type="submit" className="button" disabled={busy}>
        {busy ? "확인하는 중…" : "갤러리에 올리기"}
      </button>
      {message && (
        <p className={message.ok ? "gallery-form__ok" : "gallery-form__error"} role="status">
          {message.text}
        </p>
      )}
    </form>
  );
}
