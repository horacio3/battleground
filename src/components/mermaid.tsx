"use client";

import { toast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Codeblock } from "./codeblock";
import { Button } from "./ui/button";

export const Mermaid = ({ source, id }: { source: string; id: string }) => {
  const { resolvedTheme: theme } = useTheme();
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<Error | null>(null);
  const [rendered, setRendered] = useState(false);

  // Initialize mermaid once on component mount
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === "dark" ? "dark" : "forest",
    });
  }, []);

  // Render diagram whenever theme changes or on initial mount
  useEffect(() => {
    const initializeMermaid = async () => {
      if (!mermaidRef.current) return;
      
      try {
        // Clear previous content
        mermaidRef.current.innerHTML = "";
        
        // Force mermaid to use the current theme
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === "dark" ? "dark" : "forest",
        });
        
        // Generate a unique ID for this render to avoid conflicts
        const diagramId = `mermaid-diagram-${id}-${Date.now()}`;
        
        // Render the diagram
        const { svg, bindFunctions } = await mermaid.render(diagramId, source);
        
        // Only update if component is still mounted
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
          bindFunctions?.(mermaidRef.current);
          setError(null);
          setRendered(true);
        }
      } catch (error) {
        console.error("Mermaid rendering error:", error);
        setError(error as Error);
      }
    };

    // Small delay to ensure DOM is ready and theme is applied
    const timer = setTimeout(() => {
      initializeMermaid();
    }, 50);

    return () => clearTimeout(timer);
  }, [id, source, theme]);

  if (error) {
    const code = `%% Unable to render mermaid diagram.\n\n${error.message}\n\n` + source;
    return <Codeblock language="mermaid">{code}</Codeblock>;
  }

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="xsicon"
        onClick={() => {
          navigator.clipboard.writeText(source);
          toast({
            title: "Copied to clipboard",
          });
        }}
        className="absolute right-2 top-2"
      >
        <Copy className="size-4" />
      </Button>
      {!rendered && (
        <div className="my-2 flex h-32 items-center justify-center rounded-md border bg-background">
          <span className="text-sm text-muted-foreground">Loading diagram...</span>
        </div>
      )}
      <div 
        id={id} 
        ref={mermaidRef} 
        className="my-2 rounded-md border bg-background"
        style={{ display: rendered ? 'block' : 'none' }}
      />
      {/* Fallback for copying if diagram fails to render visually */}
      {!rendered && <div className="sr-only">{source}</div>}
    </div>
  );
};