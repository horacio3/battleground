import { cn } from "@/lib/utils";
import Markdown from "markdown-to-jsx";
import Image from "next/image";
import { memo } from "react";
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
      className={cn(
        "prose max-w-none overflow-y-auto overflow-x-hidden p-1 text-sm font-light dark:prose-invert prose-pre:m-0 prose-pre:bg-[#2b2b2b] prose-pre:p-1",
        className,
      )}
      options={{
        overrides: {
          code(props) {
            const { children, className } = props;
            const match = /lang-(\w+)/.exec(className || "");
            return match ? (
              <Codeblock language={match?.[1] ?? "text"}>{children}</Codeblock>
            ) : (
              <code className="code text-wrap">{children}</code>
            );
          },
          img(props) {
            const { src, alt } = props;
            return (
              <Image
                src={src ?? ""}
                alt={alt ?? ""}
                width={0}
                height={0}
                className="h-auto w-full"
                loading="eager"
                priority
              />
            );
          },
        },
      }}
    >
      {response}
    </Markdown>
  );
});
