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
    <div className="relative my-2 w-fit p-1 text-xs">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="secondary" 
            size="sm"
            className="absolute right-1 top-1 z-10 h-6 w-6 p-0 opacity-70 hover:opacity-100" 
            onClick={copyToClipboard}
          >
            <Copy className="h-3 w-3" />
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
