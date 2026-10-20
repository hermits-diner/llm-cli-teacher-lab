import { CopyButton } from "./CopyButton";

// What the teacher says to the AI. Visually unlike Cmd so the two are never confused.
export function Prompt({ children }: { children: string }) {
  const text = children.replace(/\r?\n$/, "");
  return (
    <figure className="prompt">
      <figcaption className="prompt__bar">
        <span className="prompt__title">AI에게 말하기</span>
        <CopyButton text={text} />
      </figcaption>
      <blockquote className="prompt__body">{text}</blockquote>
    </figure>
  );
}
