import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { TooltipArrow } from "@radix-ui/react-tooltip";
import { Code } from "lucide-react";

type CodeInterpreterStatusProps = {
  enabled: boolean;
  sessionId?: string;
};

/**
 * A component that shows the status of the code interpreter
 */
export function CodeInterpreterStatus({ enabled, sessionId }: CodeInterpreterStatusProps) {
  if (!enabled) return null;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="h-5 bg-blue-200 font-light dark:bg-blue-800 flex items-center gap-1">
          <Code className="h-3 w-3" />
          <span>Code Interpreter</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {sessionId ? 
          `Code Interpreter enabled (Session: ${sessionId.substring(0, 8)}...)` : 
          'Code Interpreter enabled'}
        <TooltipArrow />
      </TooltipContent>
    </Tooltip>
  );
}