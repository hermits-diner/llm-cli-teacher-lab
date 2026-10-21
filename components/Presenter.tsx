"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PERIODS } from "@/lib/site";

// Presentation mode: the site stands in for slides on the classroom screen.
// When it is on, a page is cut into one slide per "##" heading (the part
// before the first heading is slide 1), the type is larger, and ← / → move
// between slides and then on to the next period's page.
export const PRESENT_KEY = "ai-lab-present";
const CHANGED = "ai-lab-present-changed";
const GOTO = "ai-lab-present-goto";
const ORDER = ["/home", ...PERIODS.map((p) => p.href)];

function setPresent(on: boolean) {
  if (on) document.documentElement.dataset.present = "1";
  else delete document.documentElement.dataset.present;
  try {
    if (on) localStorage.setItem(PRESENT_KEY, "1");
    else localStorage.removeItem(PRESENT_KEY);
  } catch {}
  window.dispatchEvent(new Event(CHANGED));
}

function usePresent(): boolean {
  const [on, set] = useState(false);
  useEffect(() => {
    const sync = () => set(document.documentElement.dataset.present === "1");
    sync();
    window.addEventListener(CHANGED, sync);
    return () => window.removeEventListener(CHANGED, sync);
  }, []);
  return on;
}

function inField(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement | null)?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

// Top-level blocks of <main>, grouped into slides at each <h2>.
function slidesOf(main: HTMLElement): HTMLElement[][] {
  const groups: HTMLElement[][] = [[]];
  for (const el of Array.from(main.children) as HTMLElement[]) {
    if (el.tagName === "H2" && groups[groups.length - 1].length) groups.push([]);
    groups[groups.length - 1].push(el);
  }
  return groups.filter((g) => g.length);
}

export function PresentToggle() {
  const on = usePresent();
  return (
    <button
      type="button"
      className="present-toggle"
      aria-pressed={on}
      onClick={() => setPresent(!on)}
      title="P 키로도 켜고 끌 수 있습니다"
    >
      {on ? "발표 모드 끄기" : "발표 모드"}
    </button>
  );
}

export function Presenter() {
  const on = usePresent();
  const pathname = usePathname();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);

  const apply = useCallback((i: number) => {
    const main = document.getElementById("main");
    if (!main) return;
    const slides = slidesOf(main);
    const at = Math.min(Math.max(i, 0), slides.length - 1);
    slides.forEach((g, n) => g.forEach((el) => (el.hidden = n !== at)));
    setIndex(at);
    setTotal(slides.length);
    window.scrollTo(0, 0);
  }, []);

  const clear = useCallback(() => {
    const main = document.getElementById("main");
    if (main) for (const el of Array.from(main.children) as HTMLElement[]) el.hidden = false;
  }, []);

  // (Re)cut the page on every route change while presenting; show everything otherwise.
  useEffect(() => {
    if (!on) {
      clear();
      return;
    }
    let start = 0;
    try {
      if (sessionStorage.getItem(GOTO) === "last") start = 9999;
      sessionStorage.removeItem(GOTO);
    } catch {}
    apply(start);
  }, [on, pathname, apply, clear]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || inField(e)) return;
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        setPresent(document.documentElement.dataset.present !== "1");
        return;
      }
      if (!on) return;
      const pos = ORDER.indexOf(pathname);
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (index < total - 1) apply(index + 1);
        else if (pos !== -1 && pos < ORDER.length - 1) router.push(ORDER[pos + 1]);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (index > 0) apply(index - 1);
        else if (pos > 0) {
          try {
            sessionStorage.setItem(GOTO, "last");
          } catch {}
          router.push(ORDER[pos - 1]);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [on, index, total, pathname, apply, router]);

  if (!on || !total) return null;
  const pos = ORDER.indexOf(pathname);
  const next = index === total - 1 && pos !== -1 && pos < ORDER.length - 1 ? ORDER[pos + 1] : null;
  const nextPeriod = next ? PERIODS.find((p) => p.href === next) : null;
  return (
    <div className="present-bar" role="status" aria-live="polite">
      <span className="present-bar__count">
        {index + 1} / {total}
      </span>
      <span className="present-bar__hint" aria-hidden="true">
        {next ? `→ ${nextPeriod ? `${nextPeriod.label} ${nextPeriod.title}` : "다음"}` : "← →"}
      </span>
      <button type="button" className="present-bar__close" onClick={() => setPresent(false)}>
        끄기
      </button>
    </div>
  );
}
