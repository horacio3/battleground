"use client";

import { ImagePanel } from "@/components/image-panel";
import { Button } from "@/components/ui/button";
import { usePub } from "@/lib/events";
import { useImageStore } from "@/stores/image-store";
import { SendHorizonal, Sparkles, Trash2 } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";

export default function Image() {
  const publish = usePub();
  const prompt = useImageStore((state) => state.prompt);
  const results = useImageStore((state) => state.results);
  const setPromptText = useImageStore((state) => state.setPromptText);

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2">
      <div className="rounded-md border p-2 focus-within:border-ring">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground">Prompt</p>
            <Sparkles className="h-3 w-3" />
          </div>
          <div className="ml-auto flex flex-row items-center gap-2">
            <Button
              variant="ghost"
              size="xsicon"
              disabled={!prompt}
              title="Clear prompt"
              onClick={() => setPromptText("")}
            >
              <Trash2 className="size-4" />
            </Button>
            <Button variant="ghost" size="xsicon" disabled={!prompt} onClick={() => publish("image-executed", prompt)}>
              <SendHorizonal className="size-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <TextareaAutosize
            placeholder="Start typing a prompt for the AI models, then hit Execute to see the results."
            maxRows={10}
            minRows={3}
            className="w-full resize-none bg-transparent text-sm font-light focus:outline-none"
            value={prompt}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                publish("image-executed", prompt);
              }
            }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-row gap-2 overflow-x-auto overflow-y-hidden">
        {results.map((model) => (
          <ImagePanel key={model.id} id={model.id} />
        ))}
      </div>
    </main>
  );
}
