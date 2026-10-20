import { CopyButton } from "./CopyButton";

// A Windows cmd window, so teachers recognise it on their own screen.
// Optional first line "@cwd <path>" sets the prompt path shown before the command.
export function Cmd({ children }: { children: string }) {
  let text = children.replace(/\r?\n$/, "");
  let cwd = "C:\\Users\\선생님";
  const directive = text.match(/^@cwd (.+)\r?\n/);
  if (directive) {
    cwd = directive[1];
    text = text.slice(directive[0].length);
  }
  return (
    <figure className="cmd">
      <figcaption className="cmd__bar">
        <span className="cmd__title">명령 프롬프트(cmd)에 붙여넣기</span>
        <CopyButton text={text} />
      </figcaption>
      <pre className="cmd__body">
        <span className="cmd__prompt" aria-hidden="true">
          {cwd}&gt;
        </span>
        <code>{text}</code>
      </pre>
    </figure>
  );
}
