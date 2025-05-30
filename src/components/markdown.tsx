import { cn } from "@/lib/utils";
import Markdown from "markdown-to-jsx";
import { nanoid } from "nanoid";
import { memo, useEffect } from "react";
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
  
  // Handle copy event to preserve formatting but remove background colors
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      // Check if the selection is within our markdown component
      let isWithinMarkdown = false;
      let node = selection.anchorNode;
      while (node) {
        if (node.nodeType === 1 && (node as Element).classList?.contains('markdown-content')) {
          isWithinMarkdown = true;
          break;
        }
        node = node.parentNode;
      }
      
      if (isWithinMarkdown && e.clipboardData) {
        // Create a temporary div to hold the HTML content
        const tempDiv = document.createElement('div');
        
        // Clone the selected content
        const range = selection.getRangeAt(0);
        tempDiv.appendChild(range.cloneContents());
        
        // Remove background colors from all elements in the temp div
        const allElements = tempDiv.querySelectorAll('*');
        allElements.forEach(el => {
          if (el instanceof HTMLElement) {
            el.style.backgroundColor = 'transparent';
            el.style.color = '#000';
          }
        });
        
        // Set both HTML and plain text
        e.clipboardData.setData('text/html', tempDiv.innerHTML);
        e.clipboardData.setData('text/plain', selection.toString());
        e.preventDefault();
      }
    };
    
    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, []);
  
  return (
    <Markdown
      className={cn(
        "prose flex max-w-none flex-col overflow-y-auto overflow-x-hidden p-1 text-sm font-light dark:prose-invert prose-pre:m-0 prose-pre:rounded-md prose-pre:bg-transparent prose-pre:p-0 prose-pre:text-sm prose-pre:font-light markdown-content",
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
