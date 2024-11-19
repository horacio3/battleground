import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePrompts } from "@/hooks/use-prompt";
import { cn } from "@/lib/utils";
import { usePromptStore } from "@/stores/prompt-store";
import { CommandLoading } from "cmdk";
import { Check, CloudDownload } from "lucide-react";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function PromptSelect() {
  const prompt = usePromptStore((state) => state.prompt);
  const setPromptSummary = usePromptStore((state) => state.setPromptSummary);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { data: prompts, isLoading, isError } = usePrompts();

  return (
    <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="xsicon" aria-expanded={dropdownOpen}>
              <CloudDownload className="size-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" className="invert">
          Load an existing prompt
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-[380px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search prompts..." />
          <CommandEmpty>{isError ? "Failed to load prompts" : "No prompts found."}</CommandEmpty>
          {isLoading && <CommandLoading />}
          <CommandList>
            <CommandGroup heading="Global Prompts"></CommandGroup>
            {prompts?.map((promptOption) => (
              <CommandItem
                key={promptOption.id}
                value={promptOption.name}
                className="flex flex-row items-center gap-2 text-xs"
                onSelect={() => {
                  if (promptOption.id !== prompt?.id) {
                    setPromptSummary(promptOption);
                  }
                  setDropdownOpen(false);
                }}
              >
                <div className={cn("flex flex-col gap-1", promptOption.id === prompt?.id && "text-primary")}>
                  <div>{promptOption.name}</div>
                  <div className="text-xs font-light text-gray-400">{promptOption.description ?? "-"}</div>
                </div>
                <div className="m-auto" />
                {promptOption.id === prompt?.id && <Check className="mr-2 h-4 w-4" />}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
