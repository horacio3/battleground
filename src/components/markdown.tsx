import { cn } from "@/lib/utils";
import Markdown from "markdown-to-jsx";
import { nanoid } from "nanoid";
import { memo } from "react";
import { Codeblock } from "./codeblock";
import { Mermaid } from "./mermaid";
import { escapeHtml } from "markdown-to-jsx/dist/utils";

export const MemoizedMarkdown = memo(function MarkdownComponent({
  messageId,
  response,
  className,
  isLoading = false,
}: {
  messageId?: string;
  response: string;
  className?: string;
  isLoading?: boolean;
}) {
  // Escape angle brackets in user messages to prevent React from trying to render them as components
  const safeResponse = response.replace(/<([A-Za-z][A-Za-z0-9]*)(>|\s)/g, '&lt;$1$2');
  
  return (
    <Markdown
      className={cn(
        "prose flex max-w-none flex-col overflow-y-auto overflow-x-hidden p-1 text-sm font-light dark:prose-invert prose-pre:m-0 prose-pre:rounded-md prose-pre:bg-transparent prose-pre:p-0 prose-pre:text-sm prose-pre:font-light",
        className,
      )}
      options={{
        overrides: {
          p(props) {
            return <div {...props} />;
          },
          code(props) {
            const { children, className } = props;
            const match = /lang-(\w+)/.exec(className || "");

            if (match?.[1] === "mermaid") {
              return isLoading ? (
                <span className="text-foreground">Loading diagram...</span>
              ) : (
                <Mermaid source={children.toString()} id={nanoid()} />
              );
            }

            const lines = children.toString().split("\n") as string[];

            if (lines?.[0].trim() === "mermaid") {
              return isLoading ? (
                <span className="text-foreground">Loading diagram...</span>
              ) : (
                <Mermaid source={lines.slice(1).join("\n")} id={nanoid()} />
              );
            }

            return match ? (
              <Codeblock language={match?.[1] ?? "text"}>{children}</Codeblock>
            ) : (
              <div className="my-1 inline-block rounded-md border bg-background p-1">
                <code className="code text-wrap font-mono text-xs text-foreground">{children}</code>
              </div>
            );
          },
          img(props) {
            const { src, alt } = props;
            return <img src={src} alt={alt} className="m-2 max-h-96 object-contain" />;
          },
        },
      }}
    >
      {safeResponse}
    </Markdown>
  );
});
