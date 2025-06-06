"use client";

import { useToast } from "@/hooks/use-toast";
import { usePub, useSub } from "@/lib/events";
import { getProviderIcon } from "@/lib/get-provider-icon";
import { textModels } from "@/lib/model/models";
import { cn } from "@/lib/utils";
import { handleStorageError, useChatStore } from "@/stores/chat-store";
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
      let errorMessage = "";
      let errorType = "unknown";
      
      try {
        // Try to parse the error message
        const parsedError = JSON.parse(error.message);
        errorMessage = parsedError.message || parsedError.name || "Unknown error";
        
        // Check for blank text field error
        if (errorMessage.includes("text field") && errorMessage.includes("blank")) {
          errorType = "validation";
          errorMessage = "Empty message content detected";
          toast({
            title: `${chat.model.id}: Message Validation Error`,
            description: "Cannot send empty messages. Please add content to your message.",
          });
        }
        // Check for specific error types
        else if (parsedError.name === "AI_LoadSettingError") {
          errorType = "credentials";
          errorMessage = "Missing AWS credentials for Bedrock";
          toast({
            title: `${chat.model.id}: AWS Credentials Error`,
            description: "AWS credentials for Bedrock are missing or invalid. Message saved.",
          });
        }
        // Check for common credential-related keywords
        else if (errorMessage.toLowerCase().includes("credential") || 
            errorMessage.toLowerCase().includes("auth") || 
            errorMessage.toLowerCase().includes("key") ||
            errorMessage.toLowerCase().includes("permission") ||
            errorMessage.toLowerCase().includes("access")) {
          errorType = "credentials";
          toast({
            title: `${chat.model.id}: Authentication Error`,
            description: "Invalid or expired credentials. Message saved.",
          });
        } else {
          errorType = "api";
          toast({
            title: `${chat.model.id}: ${errorMessage}`,
            description: "Message saved. You can retry sending it.",
          });
        }
      } catch (e) {
        // If we can't parse the error, it's likely a network issue
        errorType = "network";
        errorMessage = "Network connection error";
        toast({
          title: `${chat.model.id}: Network Error`,
          description: "Check your internet connection. Message saved.",
        });
      } finally {
        // Save the failed message to the chat store with the specific error type
        useChatStore.getState().setFailedMessage(chat.id, {
          content: chat.input || messages[messages.length - 1]?.content || "",
          attachments: chat.attachments,
          error: errorMessage,
          errorType: errorType
        });
        
        setChatMessages(chat.id, messages.slice(0, -1));
        setMessages(messages.slice(0, -1));
      }
    },
  });

  useEffect(() => {
    try {
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
    } catch (error) {
      // Handle localStorage quota exceeded error
      if (error instanceof Error && error.name === 'QuotaExceededError' || 
          (error.toString && error.toString().includes('quota'))) {
        toast({
          title: "Storage Limit Reached",
          description: "Clearing old chat history to make space for new messages.",
        });
        handleStorageError();
      } else {
        console.error("Error updating chat messages:", error);
      }
    }
  }, [chat.id, messages, setChatMessages, toast]);

  useSub("chat-executed", () => {
    if (!chat.synced) return;
    append({ role: "user", content: chat.input, createdAt: new Date(), data: { images: chat.attachments } });
    resetChatInput(chat.id);
  });

  const executeChat = () => {
    try {
      // Clear any existing failed message when attempting to send a new one
      if (chat.failedMessage) {
        useChatStore.getState().clearFailedMessage(chat.id);
      }
      
      // Validate that the message has content before sending
      if (!chat.input.trim()) {
        toast({
          title: "Empty Message",
          description: "Cannot send empty messages. Please add content to your message.",
        });
        return;
      }
      
      if (chat.synced) {
        publish("chat-executed");
      } else {
        append({ role: "user", content: chat.input, createdAt: new Date(), data: { images: chat.attachments } });
        resetChatInput(chat.id);
      }
    } catch (error) {
      // Handle localStorage quota exceeded error
      if (error instanceof Error && error.name === 'QuotaExceededError' || 
          (error.toString && error.toString().includes('quota'))) {
        toast({
          title: "Storage Limit Reached",
          description: "Clearing old chat history to make space for new messages.",
        });
        if (handleStorageError()) {
          // Try again after clearing storage
          setTimeout(() => executeChat(), 100);
        }
      } else {
        console.error("Error executing chat:", error);
        toast({
          title: "Error Sending Message",
          description: "An error occurred while sending your message. Please try again.",
        });
      }
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
        {/* Display failed message with retry button if exists */}
        {chat.failedMessage && (
          <div className="flex flex-col gap-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
            <div className="flex flex-row items-start gap-4">
              <Avatar className="size-6">
                {user?.imageUrl ? (
                  <AvatarImage src={user?.imageUrl} />
                ) : (
                  <AvatarFallback>{userInitials}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-row justify-between gap-2">
                  <div className="p-0.5">
                    <p>{chat.failedMessage.content}</p>
                    <p className="text-sm text-red-500 mt-2">
                      {chat.failedMessage.errorType === 'network' ? '🌐 Network Error: ' : 
                       chat.failedMessage.errorType === 'credentials' ? '🔑 Credential Error: ' : 
                       chat.failedMessage.errorType === 'api' ? '⚠️ API Error: ' : '❌ Error: '}
                      {chat.failedMessage.error}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {chat.failedMessage.attachments?.length > 0 && (
              <div className="flex flex-row flex-wrap items-center gap-1">
                <Paperclip className="m-1 mr-4 h-4 w-4 text-muted-foreground" />
                {chat.failedMessage.attachments.map((image) => (
                  <ImageChip key={image.name} {...image} />
                ))}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  useChatStore.getState().clearFailedMessage(chat.id);
                }}
              >
                Dismiss
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => {
                  // Store the failed message content and attachments
                  const failedContent = chat.failedMessage?.content || "";
                  const failedAttachments = [...(chat.failedMessage?.attachments || [])];
                  
                  // Clear the failed message first
                  useChatStore.getState().clearFailedMessage(chat.id);
                  
                  // Set the input to the failed message content
                  setChatInput(chat.id, failedContent);
                  
                  // Add any attachments
                  failedAttachments.forEach(attachment => {
                    addAttachmentToChat(chat.id, attachment);
                  });
                  
                  // Use setTimeout to ensure state updates before executing
                  setTimeout(() => executeChat(), 0);
                }}
              >
                <RefreshCcwIcon className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        )}
        
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
