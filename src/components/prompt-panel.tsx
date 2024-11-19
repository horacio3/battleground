"use client";

import { useSub } from "@/lib/events";
import { textModels } from "@/lib/model/models";
import { usePromptStore } from "@/stores/prompt-store";
import { ResponseMetrics } from "@/types/response-metrics.type";
import { useChat } from "@ai-sdk/react";
import { TooltipArrow } from "@radix-ui/react-tooltip";
import { Activity, EllipsisIcon, Loader2, PlusIcon, RefreshCcwIcon, TrashIcon, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import { toast } from "sonner";
import { ChatConfig } from "./chat-config";
import { ChatMessageButtons } from "./chat-message-buttons";
import { MemoizedMarkdown } from "./markdown";
import { MetricsDisplay } from "./metrics-display";
import { ModelSelect } from "./model-select";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export type PromptPanelProps = {
  resultId: string;
};

export const PromptPanel = ({ resultId }: PromptPanelProps) => {
  const prompt = usePromptStore((state) => state.prompt);
  const result = usePromptStore((state) => state.results.find((m) => m.id === resultId))!;
  const {
    results,
    addResults,
    removeResults,
    setModel,
    clearResults,
    setResultsOutput,
    setResultsMetrics,
    updateModelParams,
  } = usePromptStore();
  const [updateData, setUpdateData] = useState(false);

  const { messages, append, setMessages, isLoading, data } = useChat({
    id: result?.id,
    initialInput: prompt.text,
    body: {
      modelId: result?.model.id,
      config: result?.model.config,
    },
    streamProtocol: "data",
    sendExtraMessageFields: true,
    onFinish() {
      setUpdateData(true);
    },
    onError(error) {
      const { message } = JSON.parse(error.message);
      toast.error(`${result?.model.id}: ${message}`);
    },
  });

  // update assistant messages with data if available
  useEffect(() => {
    if (!updateData) return;
    const lastData = data?.at(-1);
    if (!lastData) return;
    setResultsMetrics(resultId, lastData as ResponseMetrics);
    setUpdateData(false);
  }, [data, resultId, setResultsMetrics, updateData]);

  useEffect(() => {
    const lastMessage = messages?.at(-1);
    if (!lastMessage) return;
    if (lastMessage.role !== "assistant") return;
    setResultsOutput(resultId, lastMessage.content);
  }, [messages, resultId, setResultsOutput]);

  useSub("prompt-executed", (message) => {
    setMessages([]);
    setResultsOutput(resultId, "");
    append({ role: "user", content: message, createdAt: new Date(), data: { images: prompt.attachments } });
  });

  return (
    <div className="min-width-[465px] flex flex-1 flex-col divide-y rounded-md border">
      <div className="flex flex-row items-center gap-1 overflow-hidden rounded-t-md bg-muted p-2 dark:bg-background">
        <ModelSelect
          models={textModels}
          selectedModelId={result?.model.id ?? ""}
          onChange={(modelId) => {
            setModel(resultId, textModels.find((m) => m.id === modelId) ?? textModels[0]);
          }}
        />

        {prompt.attachments?.length > 0 && !result?.model.inputModalities.includes("IMAGE") && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger>
              <TriangleAlert className="mx-2 h-4 w-4 text-yellow-500" />
            </TooltipTrigger>
            <TooltipContent className="text-xs invert">
              This model does not support the image input modality.
              <br />
              The output response may be incorrect.
            </TooltipContent>
          </Tooltip>
        )}

        {isLoading && <Loader2 className="mx-2 h-4 w-4 animate-spin self-center text-green-600" />}

        <div className="mr-auto" />

        {!isLoading && <ChatMessageButtons message={result?.output ?? ""} />}

        <Separator orientation="vertical" />

        <div className="flex flex-row items-center gap-2">
          <ChatConfig
            model={result.model}
            onConfigChange={(config) => updateModelParams(result.id, config)}
            onSynchronizeSystemPrompt={() => {
              results.forEach((r) => {
                if (r.id === result.id) return;
                updateModelParams(r.id, { systemPrompt: result.model.config?.systemPrompt });
              });
            }}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="xsicon" onClick={() => addResults()}>
                <PlusIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="dark text-xs dark:invert">
              Add model for comparison
              <TooltipArrow />
            </TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="xsicon">
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-2">
              <DropdownMenuItem onClick={() => clearResults(resultId)}>
                <RefreshCcwIcon className="mr-2 h-4 w-4" />
                Clear Chat
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500" onClick={() => removeResults(resultId)}>
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <ScrollToBottom className="flex flex-1 overflow-y-auto p-3">
        <MemoizedMarkdown response={result?.output ?? ""} />
      </ScrollToBottom>
      {result?.metrics && (
        <div className="flex flex-row items-center gap-1 rounded-b-md border-t bg-muted p-2 dark:bg-background">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>Response Metrics</TooltipContent>
          </Tooltip>
          <div className="flex flex-wrap gap-x-1 gap-y-2">
            <MetricsDisplay {...result.metrics} />
          </div>
        </div>
      )}
    </div>
  );
};
