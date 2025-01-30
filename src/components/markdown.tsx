import { cn } from "@/lib/utils";
import Markdown from "markdown-to-jsx";
import { nanoid } from "nanoid";
import { memo } from "react";
import { Codeblock } from "./codeblock";
import { MermaidComponent as Mermaid } from "./mermaid";

export const MemoizedMarkdown = memo(function MarkdownComponent({
  response,
  className,
}: {
  response: string;
  className?: string;
}) {
  return (
    <Markdown
      className={cn(
        "prose max-w-none overflow-y-auto overflow-x-hidden p-1 text-sm font-light dark:prose-invert prose-pre:m-0 prose-pre:rounded-md prose-pre:bg-transparent prose-pre:p-0 prose-pre:text-sm prose-pre:font-light",
        className,
      )}
      options={{
        overrides: {
          code(props) {
            const { children, className } = props;
            const match = /lang-(\w+)/.exec(className || "");

            if (match?.[1] === "mermaid") {
              return <Mermaid source={children.toString()} id={nanoid()} />;
            }

            return match ? (
              <Codeblock language={match?.[1] ?? "text"}>{children}</Codeblock>
            ) : (
              <code className="code text-wrap">{children}</code>
            );
          },
        },
      }}
    >
      {response}
    </Markdown>
  );
});
