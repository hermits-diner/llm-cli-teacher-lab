import { TOOLS, type LevelId, type ToolId } from "@/lib/site";

// All variants are rendered on the server; CSS keyed on <html data-tool> shows one.
export function ForTool({ tool, children }: { tool: ToolId | ToolId[]; children: React.ReactNode }) {
  const ids = Array.isArray(tool) ? tool.join(" ") : tool;
  return <div data-for-tool={ids}>{children}</div>;
}

// Same idea for the school level, keyed on <html data-level>.
export function ForLevel({ level, children }: { level: LevelId; children: React.ReactNode }) {
  return <div data-for-level={level}>{children}</div>;
}

type Field = "name" | "launcher" | "account" | "cost";

export function ToolText({ field }: { field: Field }) {
  return (
    <>
      {TOOLS.map((t) => (
        <span key={t.id} data-for-tool={t.id}>
          {t[field]}
        </span>
      ))}
    </>
  );
}
