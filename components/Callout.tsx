const TITLES = { tip: "도움말", warn: "주의", check: "확인" } as const;

export function Callout({
  kind = "tip",
  title,
  children,
}: {
  kind?: keyof typeof TITLES;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <aside className={`callout callout--${kind}`}>
      <p className="callout__title">{title ?? TITLES[kind]}</p>
      <div className="callout__body">{children}</div>
    </aside>
  );
}
