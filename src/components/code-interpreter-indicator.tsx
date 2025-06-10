import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { TooltipArrow } from "@radix-ui/react-tooltip";
import { Code } from "lucide-react";

type CodeInterpreterIndicatorProps = {
  enabled: boolean;
  className?: string;
};

/**
 * A small indicator component that shows when code interpreter is enabled
 */
export function CodeInterpreterIndicator({ enabled, className = "" }: CodeInterpreterIndicatorProps) {
  if (!enabled) return null;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex items-center ${className}`}>
          <Code className="h-4 w-4 text-blue-500" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        Code Interpreter Enabled
        <TooltipArrow />
      </TooltipContent>
    </Tooltip>
  );
}