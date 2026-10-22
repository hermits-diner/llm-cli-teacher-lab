"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "ai-lab-theme";
const THEMES = [
  { id: "auto", name: "자동" },
  { id: "day", name: "주간" },
  { id: "night", name: "야간" },
  { id: "chalk", name: "칠판" },
  { id: "paper", name: "종이" },
  { id: "ocean", name: "바다" },
  { id: "contrast", name: "고대비" },
] as const;
type Pref = (typeof THEMES)[number]["id"];

// Runs in <head> before first paint, like toolBootScript. "auto" is resolved
// here to day or night, so the CSS only ever sees a concrete html[data-theme].
export const themeBootScript = `try{var d=document.documentElement,p=localStorage.getItem("${THEME_KEY}");if(["day","night","chalk","paper","ocean","contrast"].indexOf(p)<0)p=matchMedia("(prefers-color-scheme: dark)").matches?"night":"day";d.dataset.theme=p}catch(e){}`;

const dark = () => window.matchMedia("(prefers-color-scheme: dark)");

function apply(pref: Pref) {
  document.documentElement.dataset.theme = pref === "auto" ? (dark().matches ? "night" : "day") : pref;
}

export function ThemePicker() {
  const [pref, setPref] = useState<Pref>("auto");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (THEMES.some((t) => t.id === saved)) setPref(saved as Pref);
    } catch {}
  }, []);

  // While on "auto", follow the device when it switches between day and night.
  useEffect(() => {
    if (pref !== "auto") return;
    const media = dark();
    const sync = () => apply("auto");
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [pref]);

  const choose = (next: Pref) => {
    setPref(next);
    apply(next);
    try {
      if (next === "auto") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch {}
  };

  return (
    <label className="theme-picker">
      <span className="theme-picker__label">화면</span>
      <select value={pref} onChange={(e) => choose(e.target.value as Pref)} aria-label="화면 색상 테마">
        {THEMES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}
