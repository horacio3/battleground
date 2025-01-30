"use client";

import { Copy } from "lucide-react";
import { useTheme } from "next-themes";
import { ReactNode } from "react";
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
  const copyToClipboard = () => {
    navigator.clipboard.writeText(String(children));
    toast("Code copied to clipboard");
  };

  return (
    <div className="relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="link" className="absolute right-1 text-muted-foreground" onClick={copyToClipboard}>
            <Copy className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={-5} className="text-xs">
          Copy code to clipboard
        </TooltipContent>
      </Tooltip>

      <SyntaxHighlighter
        language={language}
        wrapLongLines
        useInlineStyles
        style={theme === "dark" ? darkTheme : lightTheme}
        customStyle={{ margin: 0 }}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
};
