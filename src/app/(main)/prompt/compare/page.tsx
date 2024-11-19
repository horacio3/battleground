"use client";

import { ImageChip } from "@/components/image-chip";
import { MicToggle } from "@/components/mic-toggle";
import { PromptControls } from "@/components/prompt-controls";
import { PromptPanel } from "@/components/prompt-panel";
import { PromptToolbar } from "@/components/prompt-toolbar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { usePub } from "@/lib/events";
import { usePromptStore } from "@/stores/prompt-store";
import { ImagePlus, SendHorizonal, Sparkles, Trash2 } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { useFilePicker } from "use-file-picker";

export default function Prompt() {
  const publish = usePub();
  const prompt = usePromptStore((state) => state.prompt);
  const results = usePromptStore((state) => state.results);
  const { setPromptText, addAttachmentToPrompt, removeAttachmentFromPrompt } = usePromptStore();

  const { openFilePicker } = useFilePicker({
    multiple: false,
    accept: "image/*",
    readAs: "DataURL",
    onFilesSuccessfullySelected: ({ filesContent }) => {
      if (!filesContent || filesContent.length === 0) return;
      const imageData = { name: filesContent[0].name, dataUrl: filesContent[0].content };
      addAttachmentToPrompt(imageData);
    },
  });

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2">
      <PromptToolbar />

      <div className="rounded-md border p-2 focus-within:border-ring">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground">Prompt</p>
            <Sparkles className="mr-2 h-3 w-3" />
            <Separator orientation="vertical" className="h-6" />
            <PromptControls />
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
            <Button variant="ghost" size="xsicon" onClick={() => openFilePicker()}>
              <ImagePlus className="size-4" />
            </Button>
            <MicToggle
              sourceId="prompt"
              onTranscript={(transcript) => {
                setPromptText(transcript);
                publish("prompt-executed", transcript);
              }}
            />
            <Button
              variant="ghost"
              size="xsicon"
              disabled={!prompt}
              onClick={() => publish("prompt-executed", prompt.text)}
            >
              <SendHorizonal className="size-4" />
            </Button>
          </div>
        </div>
        <div className="mt-2 flex flex-col items-center">
          <TextareaAutosize
            placeholder="Start typing a prompt for the AI models, then hit Execute to see the results."
            maxRows={10}
            minRows={3}
            className="w-full resize-none bg-transparent text-sm font-light focus:outline-none"
            value={prompt.text}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                publish("prompt-executed", prompt.text);
              }
            }}
          />
          <div className="flex w-full flex-row justify-between">
            <div className="mr-auto flex flex-row flex-wrap gap-1">
              {prompt.attachments.map((image) => (
                <ImageChip
                  key={image.name}
                  {...image}
                  canRemove
                  onRemove={(name) => removeAttachmentFromPrompt(name)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-row gap-2 overflow-x-auto overflow-y-hidden">
        {results.map((model, idx) => (
          <PromptPanel key={`${model.id}-${idx}`} resultId={model.id} />
        ))}
      </div>
    </main>
  );
}
