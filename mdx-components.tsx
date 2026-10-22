import type { MDXComponents } from "mdx/types";
import type { ReactElement } from "react";
import { AgentFlow } from "@/components/AgentFlow";
import { Callout } from "@/components/Callout";
import { Cmd } from "@/components/Cmd";
import { ForLevel, ForTool, ToolText } from "@/components/ForTool";
import { LevelPicker } from "@/components/LevelPicker";
import { More } from "@/components/More";
import { PagePhoto } from "@/components/PagePhoto";
import { Prompt } from "@/components/Prompt";
import { Step, Steps } from "@/components/Steps";
import { YouTube } from "@/components/YouTube";

// ```cmd and ```prompt fences become the cmd window and the "AI에게 말하기" card, so page
// text can contain {, }, < and > without MDX reading them as JSX.
function Pre({ children }: { children?: React.ReactNode }) {
  const code = children as ReactElement<{ className?: string; children?: string }>;
  const lang = code?.props?.className?.replace("language-", "") ?? "";
  const text = String(code?.props?.children ?? "");
  if (lang === "cmd") return <Cmd>{text}</Cmd>;
  if (lang === "prompt") return <Prompt>{text}</Prompt>;
  // ```screen: what the black window shows (output, not something to type)
  if (lang === "screen")
    return (
      <pre className="screen" aria-label="화면에 보이는 내용">
        {text.replace(/\n$/, "")}
      </pre>
    );
  return <pre className="codeblock">{text.replace(/\n$/, "")}</pre>;
}

const components: MDXComponents = {
  pre: Pre,
  AgentFlow,
  PagePhoto,
  YouTube,
  Cmd,
  Prompt,
  Callout,
  ForTool,
  ForLevel,
  LevelPicker,
  ToolText,
  More,
  Steps,
  Step,
  a: ({ href = "", children, ...rest }) =>
    href.startsWith("http") ? (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    ) : (
      <a href={href} {...rest}>
        {children}
      </a>
    ),
};

export function useMDXComponents(inherited: MDXComponents): MDXComponents {
  return { ...inherited, ...components };
}
