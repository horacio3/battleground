"use client";

import { useToast } from "@/hooks/use-toast";
import { usePub, useSub } from "@/lib/events";
import { getProviderIcon } from "@/lib/get-provider-icon";
import { textModels } from "@/lib/model/models";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chat-store";
import { useProjectStore } from "@/stores/project-store";
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
import React, { useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { useFilePicker } from "use-file-picker";
import { ChatConfig } from "./chat-config";
import { ChatMessageArea } from "./chat-message-area";
import { ChatMessageButtons } from "./chat-message-buttons";
import { ImageChip } from "./image-chip";
import { MemoizedMarkdown } from "./markdown";
import { MetricsChartPopoverButton } from "./metrics-chart-popover";
import { MetricsDisplay } from "./metrics-display";
import { MetricsExportButton } from "./metrics-export-button";
import { MicToggle } from "./mic-toggle";
import { ModelSelect } from "./model-select";
import { SyncButton } from "./sync-button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
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
  // Reference to the chat message area's scroll function
  const scrollToBottomRef = React.useRef<() => void>();
  const { toast } = useToast();
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

  const { messages, append, status, setMessages } = useChat({
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
      try {
        const { message } = JSON.parse(error.message);
        toast({
          title: `${chat.model.id}: ${message}`,
          description: "Please try again.",
        });
      } catch (e) {
        toast({
          title: `${chat.model.id}: Unknown error`,
          description: "Please try again.",
        });
      } finally {
        setChatMessages(chat.id, messages.slice(0, -1));
        setMessages(messages.slice(0, -1));
      }
    },
  });

  useEffect(() => {
    if (messages.length > 0) {
      setChatMessages(chat.id, messages);
    }
    
    // Always scroll to bottom when chat ID changes or messages update
    setTimeout(() => {
      // Find the specific viewport for this chat panel
      const chatPanel = document.getElementById(`chat-panel-${chat.id}`);
      const viewport = chatPanel?.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }, 50);
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
    <div id={`chat-panel-${chat.id}`} className="min-width-[465px] relative flex flex-1 flex-col rounded-md border">
      <div className="flex flex-row items-center gap-1 rounded-t-md border-b bg-gray-50 p-2 dark:bg-background">
        <ModelSelect
          models={textModels}
          selectedModelId={chat.model.id ?? ""}
          onChange={(modelId) => {
            const newChatId = setChatModel(chat.id, textModels.find((m) => m.id === modelId) ?? textModels[0]);
            
            // Ensure the active project has the new chat ID
            const activeProjectId = useProjectStore.getState().activeProjectId;
            if (activeProjectId) {
              const project = useProjectStore.getState().projects.find(p => p.id === activeProjectId);
              if (project && !project.chatIds.includes(newChatId)) {
                useProjectStore.getState().addChatToProject(activeProjectId, newChatId);
              }
            }
          }}
        />
        <div className="mr-auto" />

        <div className="flex flex-row items-center gap-2">
          <SyncButton synced={chat.synced} onClick={() => setChatSynced(chat.id, !chat.synced)} />
          <ChatConfig
            model={chat.model}
            onConfigChange={(config) => updateModelParams(chat.id, config)}
            onSynchronizeSystemPrompt={() => {
              // Get the active project
              const activeProjectId = useProjectStore.getState().activeProjectId;
              if (!activeProjectId) return;
              
              // Get the active project's chat IDs
              const project = useProjectStore.getState().projects.find(p => p.id === activeProjectId);
              if (!project) return;
              
              // Only sync with chats in the same project
              chats.forEach((c) => {
                if (c.id === chat.id) return;
                if (project.chatIds.includes(c.id)) {
                  updateModelParams(c.id, { systemPrompt: chat.model.config?.systemPrompt });
                }
              });
            }}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="xsicon" 
                onClick={() => {
                  const newChatId = addChat();
                  // Add the new chat to the current project if one is active
                  const activeProjectId = useProjectStore.getState().activeProjectId;
                  if (activeProjectId) {
                    useProjectStore.getState().addChatToProject(activeProjectId, newChatId);
                    // Set the new chat as active
                    useChatStore.getState().setActiveChat(newChatId);
                  }
                }}
              >
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
              <DropdownMenuItem onClick={() => {
                const newChatId = resetChat(chat.id);
                
                // Ensure the active project has the new chat ID
                const activeProjectId = useProjectStore.getState().activeProjectId;
                if (activeProjectId) {
                  const project = useProjectStore.getState().projects.find(p => p.id === activeProjectId);
                  if (project && !project.chatIds.includes(newChatId)) {
                    useProjectStore.getState().addChatToProject(activeProjectId, newChatId);
                  }
                }
              }}>
                <RefreshCcwIcon className="mr-2 h-4 w-4" />
                Clear Chat
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => resetChats()}>
                <CircleX className="mr-2 h-4 w-4" />
                Clear All Chats in Project
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500" onClick={() => {
                // Remove chat from project if it belongs to one
                const activeProjectId = useProjectStore.getState().activeProjectId;
                if (activeProjectId) {
                  useProjectStore.getState().removeChatFromProject(activeProjectId, chat.id);
                }
                removeChat(chat.id);
              }}>
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ChatMessageArea scrollButtonAlignment="center" className={cn("flex flex-1 flex-col overflow-y-auto")}>
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
                  className="w-6 rounded-sm"
                />
              )}
              <div className="flex flex-1 flex-col gap-2">
                {message.parts.map((part, partIdx) => {
                  switch (part.type) {
                    case "reasoning":
                      return (
                        <Accordion key={`${message.id}-reasoning-${partIdx}`} type="single" collapsible defaultValue="reasoning">
                          <AccordionItem value="reasoning" className="-mt-1.5 rounded-md border p-2">
                            <AccordionTrigger className="p-0.5 text-sm font-normal">Thinking...</AccordionTrigger>
                            <AccordionContent className="pb-0 pt-2 font-light">
                              <MemoizedMarkdown
                                messageId={message.id}
                                response={part.reasoning}
                                className="p-0.5"
                                isLoading={status === "streaming" && message.id === messages[messages.length - 1].id}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      );
                    case "text":
                      return (
                        <div key={`${message.id}-text-${partIdx}`} className="flex flex-row justify-between gap-2">
                          <MemoizedMarkdown
                            messageId={message.id}
                            response={part.text}
                            className="p-0.5"
                            isLoading={status === "streaming" && message.id === messages[messages.length - 1].id}
                          />
                          <div className="flex">
                            <ChatMessageButtons message={part.text} />
                          </div>
                        </div>
                      );
                    default:
                      return <React.Fragment key={`${message.id}-empty-${partIdx}`}></React.Fragment>;
                  }
                })}
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
      </ChatMessageArea>

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
              if (status === "streaming") return;
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
                  setTimeout(() => executeChat(), 500);
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 focus:ring-transparent"
                disabled={!chat.input || status === "streaming"}
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
