// Detail that most readers can skip: exceptions, background, alternatives.
// Folded by default so the page (and each presentation slide) shows only
// what everyone needs; one click opens it.
export function More({ title = "자세히", children }: { title?: string; children: React.ReactNode }) {
  return (
    <details className="more">
      <summary>{title}</summary>
      <div className="more__body">{children}</div>
    </details>
  );
}
