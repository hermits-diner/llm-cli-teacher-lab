"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PERIODS } from "@/lib/site";

// The session as a school timetable. The current period is the one being taught.
export function Timetable() {
  const pathname = usePathname();
  const current = PERIODS.findIndex((p) => [p.href, ...(p.also ?? [])].some((h) => pathname.startsWith(h)));

  return (
    <nav className="timetable" aria-label="연수 순서">
      <ol className="timetable__row">
        {PERIODS.map((p, i) => (
          <li
            key={p.href}
            className="timetable__cell"
            data-state={i === current ? "now" : current !== -1 && i < current ? "past" : undefined}
          >
            <Link href={p.href} aria-current={i === current ? "page" : undefined}>
              <span className="timetable__label">
                <span className="timetable__emoji" aria-hidden="true">
                  {p.emoji}
                </span>
                {p.label}
              </span>
              <span className="timetable__name">{p.title}</span>
              <span className="timetable__time">{p.time}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
