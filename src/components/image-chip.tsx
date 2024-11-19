import { ImageData } from "@/types/image-data.type";
import { X } from "lucide-react";
import Image from "next/image";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";

type ImageChipProps = ImageData & {
  canRemove?: boolean;
  onRemove?: (name: string) => void;
};

export const ImageChip = ({ name, dataUrl, canRemove, onRemove }: ImageChipProps) => {
  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger>
        <Badge key={name} className="flex max-w-[120px] cursor-pointer items-center gap-1.5 leading-none">
          <span className="overflow-x-hidden text-ellipsis whitespace-nowrap py-0.5">{name}</span>
          {canRemove && (
            <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => onRemove?.(name)}>
              <X />
            </Button>
          )}
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent side="top" align="start">
        <Image src={dataUrl} alt={name} width={200} height={200} />
      </HoverCardContent>
    </HoverCard>
  );
};
