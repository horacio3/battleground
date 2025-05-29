"use client";

import { useChatStore } from "@/stores/chat-store";
import { cn } from "@/lib/utils";
import { PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export const ChatTabs = () => {
  const chats = useChatStore((state) => state.chats);
  const activeChat = useChatStore((state) => state.activeChat);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const addChat = useChatStore((state) => state.addChat);
  const removeChat = useChatStore((state) => state.removeChat);

  return (
    <div className="flex flex-row items-center gap-1 overflow-x-auto border-b bg-background p-1">
      {chats.map((chat) => (
        <div key={chat.id} className="flex items-center">
          <Button
            variant={activeChat === chat.id ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "rounded-md text-sm",
              activeChat === chat.id ? "bg-secondary" : "hover:bg-muted"
            )}
            onClick={() => setActiveChat(chat.id)}
          >
            {chat.model.name}
            {chats.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="ml-1 h-5 w-5 rounded-full hover:bg-destructive/20"
                onClick={(e) => {
                  e.stopPropagation();
                  removeChat(chat.id);
                }}
              >
                <TrashIcon className="h-3 w-3" />
              </Button>
            )}
          </Button>
        </div>
      ))}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
            const newChatId = addChat();
            setActiveChat(newChatId);
          }}>
            <PlusIcon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          New Chat
        </TooltipContent>
      </Tooltip>
    </div>
  );
};