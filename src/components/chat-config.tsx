"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { TextModel } from "@/lib/model/model.type";
import { ChatParams } from "@/stores/chat-store";
import { TooltipArrow } from "@radix-ui/react-tooltip";
import { ClipboardPaste, SlidersHorizontalIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function ChatConfig({
  model,
  onConfigChange,
  onSynchronizeSystemPrompt,
}: {
  model: TextModel;
  onConfigChange: (config: ChatParams) => void;
  onSynchronizeSystemPrompt?: () => void;
}) {
  return (
    <Popover>
      <Tooltip>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild tabIndex={-1}>
            <Button variant="ghost" size="xsicon" title="Model settings">
              <SlidersHorizontalIcon className="h-5 w-5" />
              <span className="sr-only">Open chat configuration</span>
            </Button>
          </TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent side="bottom" className="dark text-xs dark:invert">
          Configure chat parameters
          <TooltipArrow />
        </TooltipContent>
      </Tooltip>

      <PopoverContent className="w-96">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Chat Configuration</h4>
            <p className="text-sm text-muted-foreground">Adjust the parameters for the chat model.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="systemPrompt" className="mb-2 flex items-center justify-between">
              System Prompt
              {onSynchronizeSystemPrompt && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="xsicon"
                      disabled={!model.systemPromptSupport}
                      onClick={onSynchronizeSystemPrompt}
                    >
                      <ClipboardPaste className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="dark text-xs dark:invert">
                    Synchronize System Prompt
                  </TooltipContent>
                </Tooltip>
              )}
            </Label>
            <Textarea
              autoFocus
              id="systemPrompt"
              disabled={!model.systemPromptSupport}
              placeholder={
                model.systemPromptSupport ? "Enter system prompt..." : "System prompt not supported for this model"
              }
              value={model.config.systemPrompt}
              onChange={(e) => onConfigChange({ systemPrompt: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <div className="flex items-center gap-2">
              <Slider
                id="maxTokens"
                min={model.config.maxTokens.min}
                max={model.config.maxTokens.max}
                step={1}
                value={[model.config.maxTokens.value]}
                onValueChange={(value) => onConfigChange({ maxTokens: value[0] })}
                className="flex-grow"
              />
              <Input
                type="number"
                value={model.config.maxTokens.value}
                onChange={(e) => onConfigChange({ maxTokens: Number(e.target.value) })}
                className="w-28"
                min={0}
                max={2048}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="temperature">Temperature</Label>
            <div className="flex items-center gap-2">
              <Slider
                id="temperature"
                min={model.config.temperature.min}
                max={model.config.temperature.max}
                step={0.01}
                value={[model.config.temperature.value]}
                onValueChange={(value) => onConfigChange({ temperature: value[0] })}
                className="flex-grow"
              />
              <Input
                type="number"
                value={model.config.temperature.value.toFixed(2)}
                onChange={(e) => onConfigChange({ temperature: Number(e.target.value) })}
                className="w-28"
                min={0}
                max={2}
                step={0.01}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="topP">Top P</Label>
            <div className="flex items-center gap-2">
              <Slider
                id="topP"
                min={model.config.topP.min}
                max={model.config.topP.max}
                step={0.01}
                value={[model.config.topP.value]}
                onValueChange={(value) => onConfigChange({ topP: value[0] })}
                className="flex-grow"
              />
              <Input
                type="number"
                value={model.config.topP.value.toFixed(2)}
                onChange={(e) => onConfigChange({ topP: Number(e.target.value) })}
                className="w-28"
                min={0}
                max={1}
                step={0.01}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
