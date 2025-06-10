import { TooltipArrow } from "@radix-ui/react-tooltip";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type CodeInterpreterButtonProps = {
  enabled: boolean;
  onClick: () => void;
};

export const CodeInterpreterButton = ({ enabled, onClick }: CodeInterpreterButtonProps) => {
  return (
    <div className="flex flex-row items-center gap-2">
      {enabled && (
        <Badge variant="outline" className="h-5 bg-blue-200 font-light dark:bg-blue-800">
          Enabled
        </Badge>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="xsicon" variant="ghost" onClick={onClick}>
            {enabled ? <ToggleRight className="text-blue-500" /> : <ToggleLeft />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Toggle Code Interpreter
          <TooltipArrow />
        </TooltipContent>
      </Tooltip>
    </div>
  );
};