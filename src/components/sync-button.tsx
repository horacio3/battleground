import { TooltipArrow } from "@radix-ui/react-tooltip";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type SyncButtonProps = {
  synced: boolean;
  onClick: () => void;
};

export const SyncButton = ({ synced, onClick }: SyncButtonProps) => {
  return (
    <div className="flex flex-row items-center gap-2">
      {synced && (
        <Badge variant="outline" className="h-5 bg-green-200 font-light dark:bg-green-800">
          Synced
        </Badge>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="xsicon" variant="ghost" onClick={onClick}>
            {synced ? <ToggleRight /> : <ToggleLeft />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="dark text-xs dark:invert">
          Sync chat messages with other models
          <TooltipArrow />
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
