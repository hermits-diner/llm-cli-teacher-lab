"use client";

import { useEffect, useId, useState } from "react";

const PREFIX = "ai-lab-step:";

export function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="steps">{children}</ol>;
}

// One step of a sequence. Ticking it leaves a teacher's "확인" stamp; the state is
// remembered in this browser only.
export function Step({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const [done, setDone] = useState(false);
  const inputId = useId();

  useEffect(() => {
    try {
      setDone(localStorage.getItem(PREFIX + id) === "1");
    } catch {}
  }, [id]);

  function toggle() {
    const next = !done;
    setDone(next);
    try {
      if (next) localStorage.setItem(PREFIX + id, "1");
      else localStorage.removeItem(PREFIX + id);
    } catch {}
  }

  return (
    <li className="step" data-done={done || undefined} id={id}>
      <div className="step__head">
        <h3 className="step__title">{title}</h3>
        <label className="step__check" htmlFor={inputId}>
          <input id={inputId} type="checkbox" checked={done} onChange={toggle} />
          <span>{done ? "했어요" : "다 했으면 체크"}</span>
        </label>
        {done && (
          <span className="stamp" aria-hidden="true">
            확인
          </span>
        )}
      </div>
      <div className="step__body">{children}</div>
    </li>
  );
}
