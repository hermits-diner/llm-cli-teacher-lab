// Line icons drawn like ballpoint marks on a handout: one stroke weight,
// round ends, and the colour of the text around them (currentColor).
// They replace colour emoji, which render differently on every OS.
const PATHS = {
  // LLM CLI란: an open book
  book: (
    <>
      <path d="M12 6.6C9.6 4.9 6.2 4.5 3 5.4v13.1c3.2-.9 6.6-.5 9 1.2 2.4-1.7 5.8-2.1 9-1.2V5.4c-3.2-.9-6.6-.5-9 1.2Z" />
      <path d="M12 6.6v13.1" />
    </>
  ),
  // 준비: a toolbox
  toolbox: (
    <>
      <rect x="3" y="8" width="18" height="11.5" rx="2" />
      <path d="M9 8V6.2c0-.9.7-1.7 1.7-1.7h2.6c1 0 1.7.8 1.7 1.7V8" />
      <path d="M3 13h18" />
      <path d="M9.5 11.5v3M14.5 11.5v3" />
    </>
  ),
  // 첫 만남: a speech bubble, saying hello to the AI
  hello: (
    <>
      <path d="M5 4.5h14c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2h-7.5L7 20v-3.5H5c-1.1 0-2-.9-2-2v-8c0-1.1.9-2 2-2Z" />
      <path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01" />
    </>
  ),
  // 웹앱 제작: a globe, for a page on the web
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 9h17M3.5 15h17" />
      <path d="M12 3c-2.4 2.5-3.6 5.5-3.6 9s1.2 6.5 3.6 9c2.4-2.5 3.6-5.5 3.6-9S14.4 5.5 12 3Z" />
    </>
  ),
  // 문서 작업: a printed notice with a folded corner
  document: (
    <>
      <path d="M6.5 3h7.5l4.5 4.5V21h-12Z" />
      <path d="M14 3v4.5h4.5" />
      <path d="M9.5 11.5h6M9.5 15h6M9.5 8h2.5" />
    </>
  ),
  // 슬라이드 제작: a screen on a stand
  slides: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M12 16v4M8.5 20.5h7" />
      <path d="M7 8.5h6M7 11.5h4" />
    </>
  ),
  // 나누고 마무리: a party popper
  party: (
    <>
      <path d="M3.5 20.5 8.2 8.8l7 7Z" />
      <path d="M12.5 5.5c.4-1 .3-2-.3-2.8M18.5 11.5c1-.4 2-.3 2.8.3M14.5 9.5l4-4" />
      <path d="M16.5 3.5h.01M20.5 7.5h.01M9.5 4.5h.01M19.5 15.5h.01" />
    </>
  ),
  // agent-coding steps (AgentFlow): folder, terminal, eye, pencil
  folder: (
    <>
      <path d="M3 7.5V18c0 .8.7 1.5 1.5 1.5h15c.8 0 1.5-.7 1.5-1.5V9c0-.8-.7-1.5-1.5-1.5H12L10 5H4.5C3.7 5 3 5.7 3 6.5Z" />
      <path d="M3 10.5h18" />
    </>
  ),
  terminal: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <path d="m7 9.5 3 2.5-3 2.5M12.5 15h4.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  pencil: (
    <>
      <path d="M15.5 4.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      <path d="m13.5 6.5 3 3" />
    </>
  ),
  // callout "도움말": a light bulb
  tip: (
    <>
      <path d="M9.5 18.8h5M10.5 21.5h3" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.1v.1h5v-.1c0-.8.4-1.6 1.1-2.1A6 6 0 0 0 12 3Z" />
    </>
  ),
  // callout "주의": a warning triangle
  warn: (
    <>
      <path d="M10.3 4.4 2.8 17.6c-.8 1.3.2 2.9 1.7 2.9h15c1.5 0 2.5-1.6 1.7-2.9L13.7 4.4c-.8-1.3-2.6-1.3-3.4 0Z" />
      <path d="M12 9.5v4.5M12 17.2h.01" />
    </>
  ),
  // callout "확인": a ticked circle
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.4 2.8 2.8 5.2-5.7" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
