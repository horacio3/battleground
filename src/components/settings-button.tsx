"use client";

import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export const usePollyVoice = () => useLocalStorage("polly-voice-id", "Ruth", { initializeWithValue: false });

const PollyVoices = ["Ruth", "Matthew", "Amy"];

export function SettingsButton() {
  const [pollyVoice, setPollyVoice] = usePollyVoice();

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="xsicon">
              <Settings className="size-4" />
              <span className="sr-only">Open Settings</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={5}>
          Settings
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="start" side="right">
        <div className="flex flex-col gap-1">
          <div className="text flex flex-col gap-1">
            <Label htmlFor="polly-voice-id" className="flex items-center gap-2 text-nowrap text-xs">
              Polly Voice
            </Label>
          </div>
          <Select name="polly-voice-id" value={pollyVoice} defaultValue="Joanna" onValueChange={setPollyVoice}>
            <SelectTrigger className="focus:ring-transparent">
              <SelectValue placeholder="Select Voice..." />
            </SelectTrigger>
            <SelectContent>
              {PollyVoices.map((voice) => (
                <SelectItem key={voice} value={voice}>
                  {voice}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
