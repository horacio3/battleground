"use client";

import { usePub, useSub } from "@/lib/events";
import { getProviderIcon } from "@/lib/get-provider-icon";
import { textModels } from "@/lib/model/models";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chat-store";
import { ImageData } from "@/types/image-data.type";
import { ResponseMetrics } from "@/types/response-metrics.type";
import { useChat } from "@ai-sdk/react";
import { useUser } from "@clerk/nextjs";
import { TooltipArrow } from "@radix-ui/react-tooltip";
import {
  Activity,
  CircleX,
  EllipsisIcon,
  Paperclip,
  PlusIcon,
  RefreshCcwIcon,
  SendHorizonal,
  Sigma,
  TrashIcon,
} from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { useFilePicker } from "use-file-picker";
import { ChatConfig } from "./chat-config";
import { ChatMessageButtons } from "./chat-message-buttons";
import { ImageChip } from "./image-chip";
import { MemoizedMarkdown } from "./markdown";
import { MetricsChartPopoverButton } from "./metrics-chart-popover";
import { MetricsDisplay } from "./metrics-display";
import { MetricsExportButton } from "./metrics-export-button";
import { MicToggle } from "./mic-toggle";
import { ModelSelect } from "./model-select";
import { SyncButton } from "./sync-button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export const ChatPanel = ({ chatId }: { chatId: string }) => {
  const publish = usePub();
  const chat = useChatStore((state) => state.chats.find((c) => c.id === chatId))!;
  const chats = useChatStore((state) => state.chats);
  const addChat = useChatStore((state) => state.addChat);
  const removeChat = useChatStore((state) => state.removeChat);
  const setChatModel = useChatStore((state) => state.setChatModel);
  const updateModelParams = useChatStore((state) => state.updateModelParams);
  const setChatSynced = useChatStore((state) => state.setChatSynced);
  const resetChatInput = useChatStore((state) => state.resetChatInput);
  const addAttachmentToChat = useChatStore((state) => state.addAttachmentToChat);
  const removeAttachmentFromChat = useChatStore((state) => state.removeAttachmentFromChat);
  const setChatInput = useChatStore((state) => state.setChatInput);
  const resetChat = useChatStore((state) => state.resetChat);
  const resetChats = useChatStore((state) => state.resetChats);
  const setChatMessages = useChatStore((state) => state.setChatMessages);

  const { user } = useUser();

  const userInitials = `${user?.firstName?.charAt(0) ?? ""}${user?.lastName?.charAt(0) ?? ""}`;

  const { openFilePicker } = useFilePicker({
    multiple: true,
    accept: "image/*",
    readAs: "DataURL",
    onFilesSuccessfullySelected: ({ filesContent }) => {
      filesContent.forEach((file) => {
        addAttachmentToChat(chat.id, { name: file.name, dataUrl: file.content });
      });
    },
  });

  const { messages, append, isLoading } = useChat({
    id: chat.id,
    experimental_throttle: 100,
    body: {
      modelId: chat.model.id,
      config: chat.model.config,
    },
    sendExtraMessageFields: true,
    streamProtocol: "data",
    initialMessages: chat.messages,
    onError(error) {
      if ("message" in error) {
        const { message } = JSON.parse(error.message);
        toast.error(`${chat.model.id}: ${message}`);
      } else {
        toast.error(`${chat.model.id}: Unknown error`);
      }
    },
  });

  useEffect(() => {
    if (messages.length > 0) {
      console.log("setting chat messages", new Date().toISOString());
      setChatMessages(chat.id, messages);
    }
  }, [chat.id, messages, setChatMessages]);

  useSub("chat-executed", () => {
    if (!chat.synced) return;
    append({ role: "user", content: chat.input, createdAt: new Date(), data: { images: chat.attachments } });
    resetChatInput(chat.id);
  });

  const executeChat = () => {
    if (chat.synced) {
      publish("chat-executed");
    } else {
      append({ role: "user", content: chat.input, createdAt: new Date(), data: { images: chat.attachments } });
      resetChatInput(chat.id);
    }
  };

  let chatMetrics: ResponseMetrics | undefined;
  chatMetrics = messages
    .filter((m) => m.role === "assistant" && m.annotations?.length)
    .map((m) => m.annotations?.[0] as ResponseMetrics)
    .reduce(
      (acc, curr) => {
        return {
          inputTokens: acc.inputTokens + curr.inputTokens,
          outputTokens: acc.outputTokens + curr.outputTokens,
          cost: (acc.cost ?? 0) + (curr.cost ?? 0),
          firstTokenTime: 0,
          responseTime: 0,
        } satisfies ResponseMetrics;
      },
      { inputTokens: 0, outputTokens: 0, cost: 0, firstTokenTime: 0, responseTime: 0 } satisfies ResponseMetrics,
    );

  const hasChatMetrics = !!chatMetrics?.inputTokens || !!chatMetrics?.outputTokens || !!chatMetrics?.cost;

  return (
    <div className="min-width-[465px] relative flex flex-1 flex-col rounded-md border">
      <div className="flex flex-row items-center gap-1 rounded-t-md border-b bg-gray-50 p-2 dark:bg-background">
        <ModelSelect
          models={textModels}
          selectedModelId={chat.model.id ?? ""}
          onChange={(modelId) => {
            setChatModel(chat.id, textModels.find((m) => m.id === modelId) ?? textModels[0]);
          }}
        />
        <div className="mr-auto" />

        <div className="flex flex-row items-center gap-2">
          <SyncButton synced={chat.synced} onClick={() => setChatSynced(chat.id, !chat.synced)} />
          <ChatConfig
            model={chat.model}
            onConfigChange={(config) => updateModelParams(chat.id, config)}
            onSynchronizeSystemPrompt={() => {
              chats.forEach((c) => {
                if (c.id === chat.id) return;
                updateModelParams(c.id, { systemPrompt: chat.model.config?.systemPrompt });
              });
            }}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="xsicon" onClick={() => addChat()}>
                <PlusIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
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
              <DropdownMenuItem onClick={() => resetChat(chat.id)}>
                <RefreshCcwIcon className="mr-2 h-4 w-4" />
                Clear Chat
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => resetChats()}>
                <CircleX className="mr-2 h-4 w-4" />
                Clear All
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500" onClick={() => removeChat(chat.id)}>
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ScrollToBottom className={cn("flex flex-1 overflow-y-auto")}>
        {messages.map((message, idx) => (
          <div
            key={message.id}
            className={cn("flex flex-col gap-4 p-4", message.role === "user" ? "" : "bg-muted dark:bg-zinc-900")}
          >
            <div className="flex flex-row items-start gap-4">
              {message.role === "user" ? (
                <Avatar className="size-6">
                  {user?.imageUrl ? (
                    <AvatarImage src={user?.imageUrl} />
                  ) : (
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  )}
                </Avatar>
              ) : (
                <Image
                  src={getProviderIcon(chat.model.provider)}
                  alt={chat.model.provider}
                  width={24}
                  height={24}
                  className="rounded-sm"
                />
              )}
              <MemoizedMarkdown response={message.content} className="flex-1 p-0.5" />
              <div className="flex flex-row gap-1">
                <ChatMessageButtons message={message.content} />
              </div>
            </div>

            {(message.role === "user" && (message.data as any))?.images?.length > 0 && (
              <div className="flex flex-row flex-wrap items-center gap-1">
                <Paperclip className="m-1 mr-4 h-4 w-4 text-muted-foreground" />
                {((message.data as any)?.images as ImageData[])?.map((image) => (
                  <ImageChip key={image.name} {...image} />
                ))}
              </div>
            )}
            {message.role === "assistant" && message.annotations?.length && (
              <div className="flex flex-row items-start gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Activity className="mr-2 mt-1 h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Response Metrics</TooltipContent>
                </Tooltip>
                <div className="flex flex-wrap gap-x-1 gap-y-2">
                  <MetricsDisplay {...(message.annotations?.[0] as ResponseMetrics)} />
                </div>
              </div>
            )}
          </div>
        ))}
      </ScrollToBottom>

      <div className="border-t bg-muted p-2 dark:bg-transparent">
        {hasChatMetrics && (
          <div className="flex flex-row items-center gap-2 px-2 pb-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Sigma className="mr-2 h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="text-xs">Total Chat Metrics</TooltipContent>
            </Tooltip>
            <MetricsDisplay {...chatMetrics} />
            <div className="ml-auto">
              <MetricsExportButton />
              <MetricsChartPopoverButton />
            </div>
          </div>
        )}

        <div className="rounded-md border bg-background p-2 focus-within:border-ring">
          <TextareaAutosize
            maxRows={12}
            minRows={2}
            placeholder="Send a message"
            className="w-full resize-none bg-transparent text-sm font-light focus:outline-none"
            value={chat.input}
            onChange={(e) => setChatInput(chat.id, e.target.value)}
            onKeyDown={(e) => {
              if (isLoading) return;
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                executeChat();
              }
            }}
          />
          <div className="flex flex-row items-start justify-between gap-4">
            <div className="mt-2 flex flex-row flex-wrap gap-1">
              {chat.model.inputModalities.includes("IMAGE") && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 focus:ring-transparent"
                  onClick={() => openFilePicker()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              )}
              {chat.attachments.map((image) => (
                <ImageChip
                  key={image.name}
                  {...image}
                  canRemove
                  onRemove={() => removeAttachmentFromChat(chat.id, image)}
                />
              ))}
            </div>
            <div className="flex flex-row items-center gap-2">
              <MicToggle
                sourceId={chat.id}
                onTranscript={(transcript) => {
                  setChatInput(chat.id, transcript);
                  setTimeout(() => publish("chat-executed"), 500);
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 focus:ring-transparent"
                disabled={!chat.input || isLoading}
                onClick={executeChat}
              >
                <SendHorizonal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
