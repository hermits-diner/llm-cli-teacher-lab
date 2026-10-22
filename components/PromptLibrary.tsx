"use client";

import { useEffect, useState } from "react";
import { Prompt } from "@/components/Prompt";

export type LibraryItem = {
  id: string;
  level: "middle" | "high" | "all";
  kind: "class" | "work";
  group: string;
  title: string;
  pain: string;
  prompt: string;
  output: string;
  skill?: string;
};

type Level = "all" | "middle" | "high";
type Kind = "all" | "class" | "work";

const LEVEL_NAMES: Record<LibraryItem["level"], string> = { all: "중·고 공통", middle: "중학교", high: "고등학교" };
const KIND_NAMES: Record<LibraryItem["kind"], string> = { class: "수업", work: "업무" };

function Chips<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; name: string; count?: number }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="tool-picker library__chips" role="radiogroup" aria-label={label}>
      <span className="tool-picker__label">{label}</span>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          className="tool-picker__option"
          onClick={() => onChange(o.id)}
        >
          {o.name}
          {o.count !== undefined && <span className="library__count">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

// Filters run in the browser; every prompt is in the page so search needs no server.
export function PromptLibrary({ items, groups }: { items: LibraryItem[]; groups: Record<LibraryItem["kind"], string[]> }) {
  const [level, setLevel] = useState<Level>("all");
  const [kind, setKind] = useState<Kind>("all");
  const [group, setGroup] = useState("all");
  const [query, setQuery] = useState("");

  // Start from the school level chosen on the practice pages, if any.
  useEffect(() => {
    const l = document.documentElement.dataset.level;
    if (l === "middle" || l === "high") setLevel(l);
  }, []);

  const byLevel = items.filter((i) => level === "all" || i.level === "all" || i.level === level);
  const byKind = byLevel.filter((i) => kind === "all" || i.kind === kind);
  const groupNames = kind === "all" ? [...groups.class, ...groups.work] : groups[kind];
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = byKind.filter(
    (i) =>
      (group === "all" || i.group === group) &&
      words.every((w) => `${i.title} ${i.pain} ${i.prompt} ${i.group}`.toLowerCase().includes(w)),
  );

  const sections = new Map<string, LibraryItem[]>();
  for (const i of shown) sections.set(i.group, [...(sections.get(i.group) ?? []), i]);

  return (
    <div className="library">
      <div className="library__filters">
        <Chips<Level>
          label="학교급"
          value={level}
          onChange={setLevel}
          options={[
            { id: "all", name: "전체" },
            { id: "middle", name: "중학교" },
            { id: "high", name: "고등학교" },
          ]}
        />
        <Chips<Kind>
          label="구분"
          value={kind}
          onChange={(k) => {
            setKind(k);
            setGroup("all");
          }}
          options={[
            { id: "all", name: "전체" },
            { id: "class", name: "수업", count: byLevel.filter((i) => i.kind === "class").length },
            { id: "work", name: "업무", count: byLevel.filter((i) => i.kind === "work").length },
          ]}
        />
        <Chips<string>
          label={kind === "work" ? "업무" : kind === "class" ? "교과" : "분야"}
          value={group}
          onChange={setGroup}
          options={[
            { id: "all", name: "전체" },
            ...groupNames
              .map((g) => ({ id: g, name: g, count: byKind.filter((i) => i.group === g).length }))
              .filter((g) => g.count > 0),
          ]}
        />
        <label className="library__search">
          <span className="tool-picker__label">찾기</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 루브릭, 세특, 가정통신문"
          />
        </label>
      </div>

      <p className="library__total" aria-live="polite">
        {shown.length}개
      </p>

      {[...sections].map(([name, list]) => (
        <section key={name} className="library__group">
          <h2>{name}</h2>
          {list.map((i) => (
            <article key={i.id} className="library__item">
              <h3>{i.title}</h3>
              <p className="library__pain">{i.pain}</p>
              <p className="library__tags">
                <span>{LEVEL_NAMES[i.level]}</span>
                <span>{KIND_NAMES[i.kind]}</span>
                <span>결과물 {i.output}</span>
                {i.skill && <span>{i.skill} 스킬</span>}
              </p>
              <Prompt>{i.prompt}</Prompt>
            </article>
          ))}
        </section>
      ))}

      {shown.length === 0 && <p>조건에 맞는 프롬프트가 없습니다. 검색어를 줄이거나 다른 분야를 골라 보세요.</p>}
    </div>
  );
}
