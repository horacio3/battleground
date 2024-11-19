import { cn } from "@/lib/utils";
import { memo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Codeblock } from "./codeblock";

export const MemoizedMarkdown = memo(function MarkdownComponent({
  response,
  className,
}: {
  response: string;
  className?: string;
}) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      urlTransform={(url) => url}
      className={cn(
        "prose max-w-none overflow-y-auto overflow-x-hidden p-1 text-sm font-light dark:prose-invert prose-pre:m-0 prose-pre:bg-[#2b2b2b] prose-pre:p-1",
        className,
      )}
      components={{
        code(props) {
          const { children, className } = props;
          const match = /language-(\w+)/.exec(className || "");
          return match ? (
            <Codeblock language={match?.[1] ?? "text"}>{children}</Codeblock>
          ) : (
            <code className="code text-wrap">{children}</code>
          );
        },
      }}
    >
      {response}
    </Markdown>
  );
});
