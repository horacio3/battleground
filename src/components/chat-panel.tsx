"use client";

import { useToast } from "@/hooks/use-toast";
import { usePub, useSub } from "@/lib/events";
import { getProviderIcon } from "@/lib/get-provider-icon";
import { textModels } from "@/lib/model/models";
import { cn } from "@/lib/utils";
import { handleStorageError, useChatStore, useChatStoreHydrated } from "@/stores/chat-store";
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
  ToggleLeft,
  ToggleRight,
  TrashIcon,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { useFilePicker } from "use-file-picker";
import { ChatConfig } from "./chat-config";
import { ChatMessageArea } from "./chat-message-area";

import { ImageChip } from "./image-chip";
import { MemoizedMarkdown } from "./markdown";
import { MetricsChartPopoverButton } from "./metrics-chart-popover";
import { MetricsDisplay } from "./metrics-display";
import { MetricsExportButton } from "./metrics-export-button";
import { MicToggle } from "./mic-toggle";
import { ModelSelect } from "./model-select";
import { SyncButton } from "./sync-button";
import { CodeInterpreterButton } from "./code-interpreter-button";
import { CodeInterpreterExamples } from "./code-interpreter-examples";
import { CodeInterpreterInfo } from "./code-interpreter-info";
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

type ChatMessagePart =
  | { type: "text"; text: string }
  | { type: "reasoning"; reasoning: string }
  | { type: "file"; mimeType: string; data: Uint8Array };

function isFilePart(part: any): part is { type: "file"; mimeType: string; data: Uint8Array } {
  return part && part.type === "file" && typeof part.mimeType === "string" && part.data instanceof Uint8Array;
}

export const ChatPanel = ({ chatId }: { chatId: string }) => {
  const isLoaded = useChatStoreHydrated();
  const scrollToBottomRef = React.useRef<() => void>();
  const { toast } = useToast();
  const publishEvent = usePub("chat-executed");
  const chat = useChatStore((state) => state.chats.find((c) => c.id === chatId));
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
  const setCodeInterpreter = useChatStore((state) => state.setCodeInterpreter);
  const { user } = useUser();

  // Use the chat's sessionId if available, otherwise create a new one
  const [sessionId] = React.useState(() => chat?.sessionId || `session-${chatId}-${Date.now()}`);

  // Track if we're currently processing a message - moved up to ensure consistent hook order
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Use the existing code interpreter toggle state from chat object
  const useCodeInterpreter = chat?.codeInterpreter?.enabled;
  

  const { openFilePicker } = useFilePicker({
    multiple: true,
    accept: "image/*",
    readAs: "DataURL",
    onFilesSuccessfullySelected: ({ filesContent }) => {
      if (!chat) return;
      filesContent.forEach((file) => {
        addAttachmentToChat(chat.id, { name: file.name, dataUrl: file.content });
      });
    },
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 5,
    onFilesRejected: ({ errors }) => {
      errors.forEach((error) => {
        toast({
          title: "File Error",
          description: error.name === "FileSizeError" ? "File size exceeds 5MB" : "Invalid file type",
        });
      });
    },
  });

  const { messages, append, status, setMessages } = useChat({
    id: chat?.id ?? "",
    experimental_throttle: 100,
    body: chat
      ? {
          modelId: chat.model.id,
          config: chat.model.config,
          codeInterpreter: {
            enabled: chat.codeInterpreter?.enabled || false,
            actionGroupName: "CodeInterpreterAction",
            agent_id: "FRVW3VGKLH",
          },
        }
      : undefined,
    sendExtraMessageFields: true,
    streamProtocol: "data",
    initialMessages: chat?.messages ?? [],
    onError(error: unknown) {
      if (!chat) return;
      let errorMessage = "An error occurred";
      let errorType: "network" | "credentials" | "api" | "unknown" = "unknown";

      try {
        if (error instanceof Error) {
          const parsedError = JSON.parse(error.message);
          errorMessage = parsedError.message ?? error.message;

          // Check for specific error types
          if (parsedError.name === "AI_LoadSettingError") {
            errorType = "credentials";
            errorMessage = "Missing AWS credentials for Bedrock";
            toast({
              title: `${chat.model.id}: AWS Credentials Error`,
              description: "AWS credentials for Bedrock are missing or invalid. Message saved.",
            });
          }
          // Check for common credential-related keywords
          else if (
            errorMessage.toLowerCase().includes("credential") ||
            errorMessage.toLowerCase().includes("auth") ||
            errorMessage.toLowerCase().includes("key") ||
            errorMessage.toLowerCase().includes("permission") ||
            errorMessage.toLowerCase().includes("access")
          ) {
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
          errorType,
        });

        setChatMessages(chat.id, messages.slice(0, -1));
        setMessages(messages.slice(0, -1));
      }
    },
  });

  useEffect(() => {
    if (!chat) return;
    try {
      if (messages.length > 0) {
        setChatMessages(chat.id, messages);
        
        // Store messages in session storage for code interpreter persistence
        if (chat.codeInterpreter?.enabled) {
          import("@/lib/persist-session").then(({ storeSessionMessages }) => {
            const simpleMessages = messages
              .filter(m => typeof m.content === "string")
              .map(m => ({
                role: m.role,
                content: m.content
              }));
            storeSessionMessages(chat.sessionId, simpleMessages);
          });
        }
      }

      // Always scroll to bottom when chat ID changes or messages update
      setTimeout(() => {
        // Find the specific viewport for this chat panel
        const chatPanel = document.getElementById(`chat-panel-${chat.id}`);
        const viewport = chatPanel?.querySelector("[data-radix-scroll-area-viewport]");
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }, 50);
    } catch (error) {
      handleStorageError(error);
    }
  }, [chat?.id, messages, setChatMessages]);
  
  // No need for the justEnabled effect anymore

  useSub("chat-executed", (_data) => {
    if (!chat) return;
    setChatSynced(chat.id, true);
  });

  // If the store is not hydrated yet, show a loading state
  if (!isLoaded) {
    return null;
  }

  // If no chat is found, create a new one with default settings
  if (!chat) {
    const newChatId = addChat();
    // Default settings: Code Interpreter OFF, Sync ON (already set in addChat)
    return <ChatPanel chatId={newChatId} />;
  }

  // Ensure codeInterpreter is initialized
  if (!chat.codeInterpreter) {
    setCodeInterpreter(chat.id, false); // Default to OFF for new chats
    return null; // Return null to prevent rendering with uninitialized state
  }

  const userInitials = `${user?.firstName?.charAt(0) ?? ""}${user?.lastName?.charAt(0) ?? ""}`;

  // This function is no longer needed as we handle everything in handleSend

  // This state is now declared at the top level

  const handleSend = async () => {
    if (!chat || isProcessing) return;
    
    try {
      // Set processing state to prevent multiple submissions
      setIsProcessing(true);
      
      // Show a toast for large inputs in code interpreter mode
      if (useCodeInterpreter && chat.input.length > 5000) {
        toast({
          title: "Processing large input",
          description: "This might take a moment. Please wait...",
        });
      }
      
      // Create the user message object
      const userMessage = {
        id: crypto.randomUUID?.() || Date.now().toString(),
        role: "user",
        content: chat.input,
        createdAt: new Date(),
        data: { images: chat.attachments },
      } as any;
      
      // Reset input immediately to improve perceived performance
      const inputContent = chat.input;
      const attachments = [...chat.attachments];
      resetChatInput(chat.id);
      
      // Use setTimeout to give the UI a chance to update
      // Add user message to the chat
      setChatMessages(chat.id, [...chat.messages, userMessage]);
      setMessages([...messages, userMessage]);
      
      if (useCodeInterpreter) {
        // Add a placeholder assistant message for code interpreter mode
        const placeholderId = crypto.randomUUID?.() || (Date.now() + 1).toString();
        const placeholderMessage = {
          id: placeholderId,
          role: "assistant",
          content: [{ type: "reasoning", reasoning: "Thinking..." }],
          createdAt: new Date(),
          data: {},
        } as any;

        setChatMessages(chat.id, [...chat.messages, userMessage, placeholderMessage]);
        setMessages([...messages, userMessage, placeholderMessage]);

      try {
        // Process in a separate microtask to avoid blocking the UI
        setTimeout(async () => {
          try {
            // Filter out messages with complex content (like arrays) and convert to simple format
            // Only include the last 10 messages to avoid context length issues
            const messageHistory = chat.messages
              .slice(-10) // Limit to last 10 messages for context
              .filter(m => typeof m.content === "string")
              .map(m => ({
                role: m.role,
                content: m.content
              }));
            
            // Store the messages in session storage for persistence
            import("@/lib/persist-session").then(({ storeSessionMessages }) => {
              storeSessionMessages(chat.sessionId, messageHistory);
            });
            
            const res = await fetch("/api/bedrock-agent", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                message: inputContent, // Use the saved input content
                sessionId: chat.sessionId,
                history: messageHistory
              }),
            });
            const data = await res.json();

            // Build the new assistant message with text and file parts
            const content: any[] = [];

            // Add text content if available
            if (data.text) {
              content.push({ type: "text", text: data.text });
            }

            // Add file content if available
            if (Array.isArray(data.files)) {
              for (const file of data.files) {
                content.push({
                  type: "file",
                  mimeType: file.type || "image/png",
                  data: Buffer.from(file.data, "base64"),
                });
              }
            }

            // Update session ID if returned from API
            if (data.sessionId && data.sessionId !== chat.sessionId) {
              // We can't directly update the session ID in the store here,
              // but we'll use it for future requests
            }
            
            const newMessage = {
              id: placeholderId, // Replace the placeholder
              role: "assistant",
              content,
              createdAt: new Date(),
              data: {},
            } as any;

            // Replace the placeholder with the real response
            const updatedMessages = [...chat!.messages, userMessage, placeholderMessage];
            const placeholderIdx = updatedMessages.findIndex((m) => m.id === placeholderId);
            if (placeholderIdx !== -1) {
              updatedMessages[placeholderIdx] = newMessage;
              setChatMessages(chat!.id, updatedMessages);
              setMessages(updatedMessages);
            }
            
            // Reset processing state
            setIsProcessing(false);
          } catch (error: any) {
            console.error("Error in code interpreter:", error);
            
            // Update the placeholder message to show the error
            const errorMessage = {
              id: placeholderId,
              role: "assistant",
              content: [{ 
                type: "text", 
                text: `Error: ${error.message || "Failed to process your request. Please try again."}`
              }],
              createdAt: new Date(),
              data: {},
            } as any;
            
            // Replace the placeholder with the error message
            const updatedMessages = [...chat!.messages, userMessage];
            updatedMessages.push(errorMessage);
            setChatMessages(chat!.id, updatedMessages);
            setMessages(updatedMessages);
            
            // Show error toast
            toast({
              title: "Code Interpreter Error",
              description: error.message || "Failed to process your request. Please try again.",
            });
            
            // Reset processing state
            setIsProcessing(false);
          }
        }, 10); // Small delay to let UI update
      } catch (error: any) {
        console.error("Error setting up code interpreter:", error);
        setIsProcessing(false);
        toast({
          title: "Error",
          description: "Failed to process your request. Please try again.",
        });
      }
    } else {
      // For non-code interpreter mode, use the AI SDK's append method
      try {
        // Use setTimeout to prevent UI freezing
        setTimeout(() => {
          try {
            publishEvent(undefined);
            append({ 
              role: "user", 
              content: inputContent, 
              createdAt: userMessage.createdAt, 
              data: { images: attachments } 
            });
            setIsProcessing(false);
          } catch (error) {
            handleStorageError(error);
            setIsProcessing(false);
          }
        }, 10);
      } catch (error) {
        handleStorageError(error);
        setIsProcessing(false);
      }
    }
  } catch (error) {
    console.error("Error in handleSend:", error);
    setIsProcessing(false);
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again.",
    });
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
      <div className="flex flex-row items-center justify-between border-b p-2">
        <div className="flex flex-row items-center gap-2">
          <ModelSelect
            models={textModels}
            selectedModelId={chat.model.id ?? ""}
            onChange={(modelId) => {
              const newChatId = setChatModel(chat.id, textModels.find((m) => m.id === modelId) ?? textModels[0]);

              // Ensure the active project has the new chat ID
              const activeProjectId = useProjectStore.getState().activeProjectId;
              if (activeProjectId) {
                const project = useProjectStore.getState().projects.find((p) => p.id === activeProjectId);
                if (project && !project.chatIds.includes(newChatId)) {
                  useProjectStore.getState().addChatToProject(activeProjectId, newChatId);
                }
              }
            }}
          />
          <div className="flex items-center gap-2">
            <CodeInterpreterButton 
              enabled={chat.codeInterpreter.enabled} 
              onClick={() => {
                const newState = !chat.codeInterpreter.enabled;
                setCodeInterpreter(chat.id, newState);
                if (newState) {
                  // Show a toast when enabling code interpreter
                  toast({
                    title: "Code Interpreter Enabled",
                    description: "You can now run code in this chat session.",
                  });
                }
              }} 
            />
            <span className="text-xs">Code Interpreter</span>
          </div>
        </div>
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
              const project = useProjectStore.getState().projects.find((p) => p.id === activeProjectId);
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
              <DropdownMenuItem
                onClick={() => {
                  const newChatId = resetChat(chat.id);

                  // Ensure the active project has the new chat ID
                  const activeProjectId = useProjectStore.getState().activeProjectId;
                  if (activeProjectId) {
                    const project = useProjectStore.getState().projects.find((p) => p.id === activeProjectId);
                    if (project && !project.chatIds.includes(newChatId)) {
                      useProjectStore.getState().addChatToProject(activeProjectId, newChatId);
                    }
                  }
                }}
              >
                <RefreshCcwIcon className="mr-2 h-4 w-4" />
                Clear Chat
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => resetChats()}>
                <CircleX className="mr-2 h-4 w-4" />
                Clear All Chats in Project
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-500"
                onClick={() => {
                  // Remove chat from project if it belongs to one
                  const activeProjectId = useProjectStore.getState().activeProjectId;
                  if (activeProjectId) {
                    useProjectStore.getState().removeChatFromProject(activeProjectId, chat.id);
                  }
                  removeChat(chat.id);
                }}
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ChatMessageArea scrollButtonAlignment="center" className={cn("flex flex-1 flex-col overflow-y-auto")}>
        {/* Show code interpreter examples if enabled and no messages */}
        {chat.codeInterpreter?.enabled && messages.length === 0 && (
          <div className="p-4">
            <CodeInterpreterInfo />
            <h3 className="mb-3 text-sm font-medium">Try these examples with Code Interpreter:</h3>
            <CodeInterpreterExamples 
              onSelect={(example) => {
                setChatInput(chat.id, example);
              }} 
            />
          </div>
        )}
        
        {/* Display failed message with retry button if exists */}
        {chat.failedMessage && (
          <div className="flex flex-col gap-4 border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-900/20">
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
                    <p className="mt-2 text-sm text-red-500">
                      {chat.failedMessage.errorType === "network"
                        ? "🌐 Network Error: "
                        : chat.failedMessage.errorType === "credentials"
                          ? "🔑 Credential Error: "
                          : chat.failedMessage.errorType === "api"
                            ? "⚠️ API Error: "
                            : "❌ Error: "}
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
                  failedAttachments.forEach((attachment) => {
                    addAttachmentToChat(chat.id, attachment);
                  });

                  // Send the message directly
                  handleSend();
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
                  src={getProviderIcon(chat!.model.provider)}
                  alt={chat!.model.provider}
                  width={24}
                  height={24}
                  className="w-6 rounded-sm"
                />
              )}
              <div className="flex flex-1 flex-col gap-2">
                {Array.isArray(message.content) ? (
                  message.content.map((part: any, partIdx: number) => {
                    if (part.type === "reasoning") {
                      return (
                        <div key={partIdx} className="italic text-muted-foreground">
                          {part.reasoning}
                        </div>
                      );
                    }
                    if (part.type === "text" && typeof part.text === "string") {
                      return (
                        <MemoizedMarkdown
                          key={partIdx}
                          messageId={message.id}
                          response={part.text}
                          className="p-0.5"
                          isLoading={status === "streaming" && message.id === messages[messages.length - 1].id}
                        />
                      );
                    }
                    if (part.type === "file" && part.data) {
                      const uint8Data = part.data instanceof Uint8Array ? part.data : new Uint8Array(part.data);

                      // Handle images
                      if (part.mimeType.startsWith("image/")) {
                        const dataUrl = `data:${part.mimeType};base64,${Buffer.from(uint8Data).toString("base64")}`;
                        return (
                          <div key={partIdx} className="my-2">
                            <img
                              src={dataUrl}
                              alt="Generated chart"
                              style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #eee" }}
                            />
                          </div>
                        );
                      }

                      // Handle other files (JSON, CSV, TXT, etc.)
                      else {
                        const base64Data = Buffer.from(uint8Data).toString("base64");
                        const fileName = `file_${partIdx}.${part.mimeType.split("/")[1] || "txt"}`;
                        const downloadUrl = `data:${part.mimeType};base64,${base64Data}`;

                        return (
                          <div key={partIdx} className="my-2 flex items-center gap-2 text-sm">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={downloadUrl}
                              download={fileName}
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              {fileName}
                            </a>
                            <span className="text-gray-400">({(uint8Data.length / 1024).toFixed(1)} KB)</span>
                          </div>
                        );
                      }
                    }
                    return null;
                  })
                ) : typeof message.content === "string" ? (
                  <MemoizedMarkdown
                    messageId={message.id}
                    response={message.content}
                    className="p-0.5"
                    isLoading={status === "streaming" && message.id === messages[messages.length - 1].id}
                  />
                ) : null}
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
            {/* Code interpreter badge removed for simplicity */}
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
            placeholder={chat.codeInterpreter?.enabled ? "Send a message or ask to run code..." : "Send a message"}
            className="w-full resize-none bg-transparent text-sm font-light focus:outline-none"
            value={chat.input}
            onChange={(e) => setChatInput(chat.id, e.target.value)}
            onKeyDown={(e) => {
              if (status === "streaming" || isProcessing) return;
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
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
              {/* Code shortcuts removed for simplicity */}
            </div>
            <div className="flex flex-row items-center gap-2">
              <MicToggle
                sourceId={chat.id}
                onTranscript={(transcript) => {
                  setChatInput(chat.id, transcript);
                  if (!isProcessing) {
                    setTimeout(() => handleSend(), 500);
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 focus:ring-transparent"
                disabled={!chat.input || status === "streaming" || isProcessing}
                onClick={handleSend}
              >
                {isProcessing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                ) : (
                  <SendHorizonal className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
