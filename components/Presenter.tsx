"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { PERIODS } from "@/lib/site";

// Presentation mode: the site stands in for slides on the classroom screen.
// When it is on, a page is cut into one slide per "##" heading (the part
// before the first heading is slide 1), the type is larger, and ← / → move
// between slides and then on to the next period's page. A section taller
// than the screen is split further between its blocks, each step box of a
// <Steps> list counting as its own block; the continuation slides repeat
// the section heading, and step numbers carry on.
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

// A unit that is shown or hidden as a whole: a top-level child of <main>, or
// one step box inside a top-level <ol class="steps">.
type Block = { el: HTMLElement; list?: HTMLElement };

const children = (el: Element) => Array.from(el.children) as HTMLElement[];
const stepLists = (main: HTMLElement) => children(main).filter((el) => el.matches("ol.steps"));

function showAll(main: HTMLElement) {
  for (const el of children(main)) el.hidden = false;
  for (const list of stepLists(main)) {
    list.style.counterReset = "";
    for (const li of children(list)) li.hidden = false;
  }
}

function blocksOf(main: HTMLElement): Block[] {
  const blocks: Block[] = [];
  for (const el of children(main)) {
    if (el.matches("ol.steps")) for (const li of children(el)) blocks.push({ el: li, list: el });
    else blocks.push({ el });
  }
  return blocks;
}

// Height a block takes on screen, margins included (collapsing is ignored,
// which only errs towards splitting a little early).
function heightOf(el: HTMLElement) {
  const cs = getComputedStyle(el);
  return el.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
}

// Measure with everything visible, then pack each "##" section into as many
// slides as the screen needs.
function paginate(main: HTMLElement): Block[][] {
  showAll(main);
  window.scrollTo(0, 0);
  const room = window.innerHeight - main.getBoundingClientRect().top - 80; // 80: page padding and the counter
  const sections: Block[][] = [[]];
  for (const b of blocksOf(main)) {
    if (b.el.tagName === "H2" && sections[sections.length - 1].length) sections.push([]);
    sections[sections.length - 1].push(b);
  }
  const slides: Block[][] = [];
  for (const section of sections.filter((s) => s.length)) {
    const head = section[0].el.tagName === "H2" ? section[0] : null;
    let slide: Block[] = [];
    let used = 0;
    for (const b of section) {
      const h = heightOf(b.el);
      const onlyHead = slide.length === 1 && slide[0] === head;
      if (slide.length && !onlyHead && used + h > room) {
        slides.push(slide);
        slide = head ? [head] : [];
        used = head ? heightOf(head.el) : 0;
      }
      slide.push(b);
      used += h;
    }
    slides.push(slide);
  }
  return slides;
}

function show(main: HTMLElement, slide: Block[]) {
  for (const el of children(main)) el.hidden = true;
  for (const list of stepLists(main)) for (const li of children(list)) li.hidden = true;
  for (const b of slide) {
    b.el.hidden = false;
    if (b.list) b.list.hidden = false;
  }
  // Hidden step boxes do not advance the CSS counter, so start each list at
  // the number of the first box on this slide.
  for (const list of stepLists(main)) {
    const first = children(list).findIndex((li) => !li.hidden);
    list.style.counterReset = first > 0 ? `step ${first}` : "";
  }
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
  const slides = useRef<Block[][]>([]);
  const at = useRef(0);

  const apply = useCallback((i: number) => {
    const main = document.getElementById("main");
    if (!main || !slides.current.length) return;
    const n = Math.min(Math.max(i, 0), slides.current.length - 1);
    show(main, slides.current[n]);
    at.current = n;
    setIndex(n);
    setTotal(slides.current.length);
    window.scrollTo(0, 0);
  }, []);

  // Cut the page into slides, keeping the reader on `i`.
  const cut = useCallback(
    (i: number) => {
      const main = document.getElementById("main");
      if (!main) return;
      slides.current = paginate(main);
      apply(i);
    },
    [apply],
  );

  // (Re)cut on every route change while presenting; show everything otherwise.
  useEffect(() => {
    const main = document.getElementById("main");
    if (!on) {
      if (main) showAll(main);
      slides.current = [];
      return;
    }
    let start = 0;
    try {
      if (sessionStorage.getItem(GOTO) === "last") start = 9999;
      sessionStorage.removeItem(GOTO);
    } catch {}
    cut(start);
    // Web fonts and images change heights after the first measurement.
    let alive = true;
    const recut = () => alive && cut(at.current);
    document.fonts?.ready.then(recut);
    window.addEventListener("load", recut);
    window.addEventListener("resize", recut);
    return () => {
      alive = false;
      window.removeEventListener("load", recut);
      window.removeEventListener("resize", recut);
    };
  }, [on, pathname, cut]);

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
