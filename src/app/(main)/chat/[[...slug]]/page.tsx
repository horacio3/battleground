"use client";

import { ChatPanel } from "@/components/chat-panel";
import { ConversationSwitcher } from "@/components/conversation-switcher";
import { useChatStore, useChatStoreHydrated } from "@/stores/chat-store";
import { useConversationStore } from "@/stores/conversation-store";
import { Loader2, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function Chat() {
  const isLoaded = useChatStoreHydrated();
  const { activeConversationId } = useConversationStore();
  const [conversationChats, setConversationChats] = useState<ReturnType<typeof useChatStore.getState.getChatsForConversation>>([]);
  const addChat = useChatStore((state) => state.addChat);

  // Update chats when active conversation changes or when chats are modified
  useEffect(() => {
    if (!isLoaded || !activeConversationId) return;

    const updateChats = () => {
      const chats = useChatStore.getState().getChatsForConversation(activeConversationId);
      setConversationChats(chats);
    };

    updateChats();
    
    // Subscribe to chat store changes
    const unsubscribe = useChatStore.subscribe(updateChats);
    
    return () => unsubscribe();
  }, [isLoaded, activeConversationId]);

  // Create a new chat if there are none for this conversation
  useEffect(() => {
    if (isLoaded && activeConversationId && conversationChats.length === 0) {
      addChat(activeConversationId);
    }
  }, [isLoaded, activeConversationId, conversationChats.length, addChat]);

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center border-b p-2">
        <ConversationSwitcher />
      </div>
      <div className="flex max-h-lvh max-w-full flex-1 flex-row gap-2 overflow-x-auto p-2">
        {isLoaded ? (
          conversationChats.length > 0 ? (
            conversationChats.map((chat) => <ChatPanel key={chat.id} chatId={chat.id} />)
          ) : (
            <div className="flex w-full flex-col items-center justify-center gap-4">
              <p className="text-sm text-muted-foreground">No chats in this conversation yet.</p>
            </div>
          )
        ) : (
          <div className="flex w-full flex-col items-center justify-center gap-4">
            <div className="flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm font-medium text-muted-foreground">Loading chats...</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
