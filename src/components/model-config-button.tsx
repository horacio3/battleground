import { ConfigValue } from "@/lib/model/model-config.type";
import { ImageModel } from "@/lib/model/model.type";
import { TooltipArrow } from "@radix-ui/react-tooltip";
import { Info, SlidersHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type ConfigValueInputProps = {
  model: ImageModel;
  setting: ConfigValue;
  setModel: (model: ImageModel) => void;
  onEnter: () => void;
};

const ConfigValueInput = ({ setting, model, setModel, onEnter }: ConfigValueInputProps) => {
  return (
    <div key={setting.name} className="flex flex-col gap-1">
      <Label htmlFor={setting.name} className="flex items-center gap-2 text-nowrap text-xs">
        {setting.label}
        {setting.description && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Info className="size-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent align="start" className="max-w-[300px] text-wrap">
              {setting.description}
            </TooltipContent>
          </Tooltip>
        )}
      </Label>
      {setting.type === "enum" ? (
        <Select
          value={setting.value}
          onValueChange={(value) => {
            setModel({
              ...model,
              config: model.config?.map((s) => (s.name === setting.name ? ({ ...s, value: value } as ConfigValue) : s)),
            });
          }}
        >
          <SelectTrigger className="focus:ring-transparent">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {setting.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <>
          <Input
            type="text"
            id={setting.name}
            className="focus-visible:ring-transparent"
            value={setting.value}
            min={setting.type === "number" ? setting.min : undefined}
            max={setting.type === "number" ? setting.max : undefined}
            onChange={(e) => {
              setModel({
                ...model,
                config: model.config?.map((s) =>
                  s.name === setting.name ? ({ ...s, value: e.target.value } as ConfigValue) : s,
                ),
              });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onEnter();
              }
            }}
          />
          {setting.type === "number" && (
            <p className="mr-2 text-right text-[0.65rem] font-light text-muted-foreground">
              {setting.min} - {setting.max}
            </p>
          )}
        </>
      )}
    </div>
  );
};

type ModelConfigButtonProps = {
  model: ImageModel;
  setModel: (model: ImageModel) => void;
};

export const ModelConfigButton = ({ model, setModel }: ModelConfigButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild tabIndex={-1}>
            <Button variant="ghost" size="xsicon" title="Model settings">
              <SlidersHorizontalIcon className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Configure inference parameters
          <TooltipArrow />
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="end" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="flex flex-col gap-2">
          {model.config?.map((setting) => (
            <ConfigValueInput
              key={setting.name}
              model={model}
              setting={setting}
              setModel={setModel}
              onEnter={() => setOpen(false)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
