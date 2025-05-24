"use client";

import { Check, Copy } from "lucide-react";
import { useTheme } from "next-themes";
import { ReactNode, useState } from "react";
import { PrismAsync as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  materialDark as darkTheme,
  materialOceanic as lightTheme,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type CodeblockProps = {
  language?: string;
  children: ReactNode;
};

export const Codeblock = ({ language = "text", children }: CodeblockProps) => {
  const { resolvedTheme: theme } = useTheme();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(String(children));
    setCopied(true);
    toast("Code copied to clipboard");
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="relative my-2 w-full rounded-md border border-border bg-muted p-0 text-xs">
      <div className="flex items-center justify-between border-b border-border px-4 py-1.5">
        <span className="text-xs text-muted-foreground">
          {language}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:bg-muted-foreground/10" 
              onClick={copyToClipboard}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent sideOffset={5} className="text-xs">
            {copied ? "Copied!" : "Copy code"}
          </TooltipContent>
        </Tooltip>
      </div>

      <SyntaxHighlighter
        language={language}
        wrapLongLines
        useInlineStyles
        style={theme === "dark" ? darkTheme : lightTheme}
        customStyle={{ 
          margin: 0,
          padding: '1rem',
          borderRadius: '0 0 0.375rem 0.375rem'
        }}
        showLineNumbers={true}
        lineNumberStyle={{
          minWidth: '2.5em',
          paddingRight: '1em',
          color: theme === "dark" ? '#606366' : '#a5a5a5',
          textAlign: 'right',
          userSelect: 'none'
        }}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
};