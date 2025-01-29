"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getProviderIcon } from "@/lib/get-provider-icon";
import { BaseModel } from "@/lib/model/model.type";
import { cn } from "@/lib/utils";
import Image from "next/image";

type ModelSelectProps = {
  models: BaseModel[];
  selectedModelId: string;
  onChange: (modelId: string) => void;
};

export function ModelSelect({ selectedModelId, models, onChange }: ModelSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedModel = models.find((model) => model.id === selectedModelId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="h-8 w-[280px] justify-between p-2">
          {selectedModel && (
            <Image
              src={getProviderIcon(selectedModel.provider)}
              alt={selectedModel.provider ?? "Unkonwn"}
              width={16}
              height={16}
            />
          )}
          <p className="truncate text-xs font-normal">{selectedModel?.name ?? "Select model..."}</p>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="start">
        <>
          <Command>
            <CommandInput placeholder="Search model..." />
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandList>
              {models.map((model) => (
                <CommandItem
                  key={model.id}
                  value={model.id}
                  className="flex flex-row items-center gap-2 rounded-none text-xs"
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                >
                  <Image src={getProviderIcon(model.provider)} alt={model.name ?? "Unkonwn"} width={16} height={16} />
                  <div className="flex flex-col gap-1">
                    <div>{model.name}</div>
                    <div className="text-xs font-light text-gray-400">{model.id}</div>
                  </div>
                  <div className="m-auto" />
                  <Check
                    className={cn("mr-2 h-4 w-4", selectedModelId === model.id ? "text-muted-foreground" : "opacity-0")}
                  />
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </>
      </PopoverContent>
    </Popover>
  );
}
