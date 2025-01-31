"use client";

import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Codeblock } from "./codeblock";

export const Mermaid = ({ source, id }: { source: string; id: string }) => {
  const { resolvedTheme: theme } = useTheme();
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    mermaid.initialize({
      theme: theme === "dark" ? "dark" : "forest",
    });

    const initializeMermaid = async () => {
      if (mermaidRef.current) {
        try {
          mermaidRef.current.innerHTML = source;
          const { svg, bindFunctions } = await mermaid.render(`mermaid-diagram-${id}`, source);
          mermaidRef.current.innerHTML = svg;
          bindFunctions?.(mermaidRef.current);
          setError(null);
        } catch (error) {
          setError(error as Error);
        }
      }
    };

    initializeMermaid();
  }, [id, source, theme]);

  if (error) {
    const code = `%% Unable to render mermaid diagram.\n\n${error.message}\n\n` + source;
    return <Codeblock language="mermaid">{code}</Codeblock>;
  }

  return <div id={id} ref={mermaidRef} className="my-2 rounded-md border bg-background"></div>;
};
