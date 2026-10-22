// The copyright line at the foot of every page and of the cover.
export function Copyright({ className }: { className?: string }) {
  return (
    <p className={className ? `copyright ${className}` : "copyright"}>
      © 2026 Oh Junghoon · <a href="mailto:hermitsdiner@gmail.com">hermitsdiner@gmail.com</a> · All Rights Reserved.
    </p>
  );
}
