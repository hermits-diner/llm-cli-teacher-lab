"use client";

import { useEffect, useState } from "react";
import { DEFAULT_LEVEL, LEVELS, type LevelId } from "@/lib/site";

export const LEVEL_KEY = "ai-lab-level";
const CHANGED = "ai-lab-level-changed";

// Runs in <head> before first paint so level-specific blocks never flash.
export const levelBootScript = `try{var l=localStorage.getItem("${LEVEL_KEY}");if(l==="middle"||l==="high")document.documentElement.dataset.level=l}catch(e){}`;

function setLevel(id: LevelId) {
  document.documentElement.dataset.level = id;
  try {
    localStorage.setItem(LEVEL_KEY, id);
  } catch {}
  window.dispatchEvent(new Event(CHANGED));
}

function useLevel(): LevelId {
  const [level, set] = useState<LevelId>(DEFAULT_LEVEL);
  useEffect(() => {
    const sync = () => set((document.documentElement.dataset.level as LevelId) || DEFAULT_LEVEL);
    sync();
    window.addEventListener(CHANGED, sync);
    return () => window.removeEventListener(CHANGED, sync);
  }, []);
  return level;
}

// Sits at the top of each practice page; the choice is shared by all of them.
export function LevelPicker() {
  const level = useLevel();
  return (
    <div className="tool-picker level-picker" role="radiogroup" aria-label="내 학교급">
      <span className="tool-picker__label">내 학교급</span>
      {LEVELS.map((l) => (
        <button
          key={l.id}
          type="button"
          role="radio"
          aria-checked={level === l.id}
          className="tool-picker__option"
          onClick={() => setLevel(l.id)}
        >
          {l.name}
        </button>
      ))}
    </div>
  );
}
