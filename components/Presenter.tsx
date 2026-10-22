"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { PERIODS } from "@/lib/site";

// Presentation mode: the site stands in for slides on the classroom screen.
// When it is on, a page is cut into one slide per "##" heading (the part
// before the first heading is slide 1), the type is larger, and ← / → move
// between slides and then on to the next period's page. A section taller
// than the screen is split further between its blocks, down to the blocks
// inside a step box; continuation slides repeat the section heading and the
// step's title, and step numbers carry on.
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

// A unit that is shown or hidden as a whole, with the wrappers that must stay
// visible around it. Top-level children of <main> are units, except that a
// <Steps> list opens into the blocks of each step body (so one tall step box
// can span slides, its title and number repeated) and a <section> opens into
// its children.
type Block = { el: HTMLElement; wraps: HTMLElement[] };

const children = (el: Element) => Array.from(el.children) as HTMLElement[];
const stepLists = (main: HTMLElement) => children(main).filter((el) => el.matches("ol.steps"));
const bodyOf = (li: HTMLElement) => li.querySelector<HTMLElement>(":scope > .step__body");

// The parts a wrapper is made of, one level down.
function partsOf(wrap: HTMLElement): HTMLElement[] {
  if (wrap.matches("ol.steps")) return children(wrap);
  if (wrap.matches("ol.steps > li")) {
    const body = bodyOf(wrap);
    return body ? children(body) : [];
  }
  return children(wrap);
}

function blocksOf(main: HTMLElement): Block[] {
  const blocks: Block[] = [];
  for (const el of children(main)) {
    if (el.matches("ol.steps")) {
      for (const li of children(el)) {
        const kids = partsOf(li);
        if (kids.length) for (const k of kids) blocks.push({ el: k, wraps: [el, li] });
        else blocks.push({ el: li, wraps: [el] });
      }
    } else if (el.tagName === "SECTION" && el.children.length) {
      for (const k of children(el)) blocks.push({ el: k, wraps: [el] });
    } else {
      blocks.push({ el, wraps: [] });
    }
  }
  return blocks;
}

// Every element paginate may hide: the blocks and their wrappers.
function unitsOf(main: HTMLElement): HTMLElement[] {
  const set = new Set<HTMLElement>(children(main));
  for (const b of blocksOf(main)) {
    set.add(b.el);
    for (const w of b.wraps) set.add(w);
  }
  return [...set];
}

function showAll(main: HTMLElement) {
  for (const el of unitsOf(main)) el.hidden = false;
  for (const list of stepLists(main)) list.style.counterReset = "";
  main.style.zoom = "";
}

// Height an element takes on screen, margins included (collapsing is ignored,
// which only errs towards splitting a little early).
function heightOf(el: HTMLElement) {
  const cs = getComputedStyle(el);
  return el.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
}

// Measure with everything visible, then pack each "##" section into as many
// slides as the screen needs. A block costs its own height plus the frame of
// every wrapper it opens (a step box's title bar and padding, say) that the
// block before it on the slide did not already open.
function paginate(main: HTMLElement): Block[][] {
  showAll(main);
  window.scrollTo(0, 0);
  const room = window.innerHeight - main.getBoundingClientRect().top - 80; // 80: page padding and the counter
  const blocks = blocksOf(main);
  const frame = new Map<HTMLElement, number>();
  for (const b of blocks)
    for (const w of b.wraps)
      if (!frame.has(w)) frame.set(w, Math.max(0, heightOf(w) - partsOf(w).reduce((t, p) => t + heightOf(p), 0)));
  const cost = (b: Block, prev?: Block) =>
    heightOf(b.el) + b.wraps.filter((w) => !prev?.wraps.includes(w)).reduce((t, w) => t + (frame.get(w) ?? 0), 0);

  const sections: Block[][] = [[]];
  for (const b of blocks) {
    if (b.el.tagName === "H2" && b.el.parentElement === main && sections[sections.length - 1].length) sections.push([]);
    sections[sections.length - 1].push(b);
  }
  const slides: Block[][] = [];
  for (const section of sections.filter((x) => x.length)) {
    const head = section[0].el.tagName === "H2" ? section[0] : null;
    let slide: Block[] = [];
    let used = 0;
    for (const b of section) {
      const h = cost(b, slide[slide.length - 1]);
      const onlyHead = slide.length === 1 && slide[0] === head;
      if (slide.length && !onlyHead && used + h > room) {
        slides.push(slide);
        slide = head ? [head] : [];
        used = head ? heightOf(head.el) : 0;
        used += cost(b, slide[slide.length - 1]);
      } else {
        used += h;
      }
      slide.push(b);
    }
    slides.push(slide);
  }
  return slides;
}

function show(main: HTMLElement, slide: Block[]) {
  for (const el of unitsOf(main)) el.hidden = true;
  for (const b of slide) {
    b.el.hidden = false;
    for (const w of b.wraps) w.hidden = false;
  }
  // Hidden step boxes do not advance the CSS counter, so start each list at
  // the number of the first box on this slide.
  for (const list of stepLists(main)) {
    const first = children(list).findIndex((li) => !li.hidden);
    list.style.counterReset = first > 0 ? `step ${first}` : "";
  }
  fit(main);
}

// A block taller than the screen on its own (a big table, a card grid) cannot
// be split further, so shrink just that slide until it fits; slides that
// already fit keep the full presentation type.
function fit(main: HTMLElement) {
  main.style.zoom = "";
  window.scrollTo(0, 0);
  const top = main.getBoundingClientRect().top;
  const room = window.innerHeight - top - 80; // same allowance as paginate
  const bottom = Math.max(top, ...children(main).filter((el) => !el.hidden).map((el) => el.getBoundingClientRect().bottom));
  const need = bottom - top;
  if (need > room) main.style.zoom = String(Math.max(0.55, room / need));
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
        {next ? `→ ${nextPeriod ? nextPeriod.title : "다음"}` : "← →"}
      </span>
      <button type="button" className="present-bar__close" onClick={() => setPresent(false)}>
        끄기
      </button>
    </div>
  );
}
