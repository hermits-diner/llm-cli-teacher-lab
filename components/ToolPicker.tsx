"use client";

import { useEffect, useState } from "react";
import { DEFAULT_TOOL, TOOLS, type ToolId } from "@/lib/site";

export const TOOL_KEY = "ai-lab-tool";
const CHANGED = "ai-lab-tool-changed";

// Runs in <head> before first paint so tool-specific blocks never flash, and so
// presentation mode (see Presenter) is on from the first frame.
export const toolBootScript = `try{var d=document.documentElement,t=localStorage.getItem("${TOOL_KEY}");if(t==="agy"||t==="codex"||t==="claude")d.dataset.tool=t;if(localStorage.getItem("ai-lab-present")==="1")d.dataset.present="1"}catch(e){}`;

function setTool(id: ToolId) {
  document.documentElement.dataset.tool = id;
  try {
    localStorage.setItem(TOOL_KEY, id);
  } catch {}
  window.dispatchEvent(new Event(CHANGED));
}

function useTool(): ToolId {
  const [tool, set] = useState<ToolId>(DEFAULT_TOOL);
  useEffect(() => {
    const sync = () => set((document.documentElement.dataset.tool as ToolId) || DEFAULT_TOOL);
    sync();
    window.addEventListener(CHANGED, sync);
    return () => window.removeEventListener(CHANGED, sync);
  }, []);
  return tool;
}

export function ToolPicker() {
  const tool = useTool();
  return (
    <div className="tool-picker" role="radiogroup" aria-label="내가 쓰는 AI 도구">
      <span className="tool-picker__label">내 도구</span>
      {TOOLS.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={tool === t.id}
          className="tool-picker__option"
          onClick={() => setTool(t.id)}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}

export function ChooseToolButton({ id }: { id: ToolId }) {
  const tool = useTool();
  const chosen = tool === id;
  return (
    <button type="button" className="choose-button" aria-pressed={chosen} onClick={() => setTool(id)}>
      {chosen ? "내 도구로 선택됨" : "이 도구로 할게요"}
    </button>
  );
}
