"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// The cover behaves like a title slide: Enter, Space, → or PageDown open the
// first page. Keys on a focused link or button are left to the browser.
export function CoverKeys({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    router.prefetch(href);
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      const onControl = tag === "A" || tag === "BUTTON" || tag === "INPUT" || tag === "TEXTAREA";
      const slideKeys = onControl ? ["ArrowRight", "PageDown"] : ["Enter", " ", "ArrowRight", "PageDown"];
      if (!slideKeys.includes(e.key)) return;
      e.preventDefault();
      router.push(href);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [href, router]);
  return null;
}
