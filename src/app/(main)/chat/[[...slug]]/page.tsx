"use client";

import { ChatPanel } from "@/components/chat-panel";
import { ProjectSelector } from "@/components/project-selector";
import { Button } from "@/components/ui/button";
import { useChatStore, useChatStoreHydrated } from "@/stores/chat-store";
import { useProjectStore } from "@/stores/project-store";
import { Loader2, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function Chat() {
  const [chats, setChats] = useState(useChatStore.getState().chats);
  const isLoaded = useChatStoreHydrated();
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const projects = useProjectStore((state) => state.projects);
  const addProject = useProjectStore((state) => state.addProject);
  const addChatToProject = useProjectStore((state) => state.addChatToProject);

  // Initialize a default project if none exists
  useEffect(() => {
    if (isLoaded && projects.length === 0) {
      addProject("Default Project");
    }
  }, [isLoaded, projects.length, addProject]);

  // Subscribe to chat store changes
  useEffect(() => {
    const unsubscribe = useChatStore.subscribe((state) => {
      if (!isLoaded) return;
      setChats(state.chats);
    });
    
    return () => unsubscribe();
  }, [isLoaded]);
  
  // Ensure there's always an active chat set when the component mounts or chats change
  useEffect(() => {
    if (!isLoaded || chats.length === 0) return;
    
    const activeChat = useChatStore.getState().activeChat;
    const activeProject = projects.find(p => p.id === activeProjectId);
    
    // If no active chat or the active chat doesn't exist in the chat store
    if (!activeChat || !chats.some(c => c.id === activeChat)) {
      // If we have an active project, set the first chat in that project as active
      if (activeProject && activeProject.chatIds.length > 0) {
        const firstProjectChatId = activeProject.chatIds[0];
        // Make sure this chat actually exists in the chat store
        if (chats.some(c => c.id === firstProjectChatId)) {
          useChatStore.getState().setActiveChat(firstProjectChatId);
        }
      } 
      // Otherwise just set the first available chat as active
      else if (chats.length > 0) {
        useChatStore.getState().setActiveChat(chats[0].id);
      }
    }
  }, [isLoaded, chats, activeProjectId, projects]);

  // Ensure all chats in the store are associated with a project
  useEffect(() => {
    if (!isLoaded || !activeProjectId) return;
    
    // Get all chats that aren't in any project
    const allProjectChatIds = projects.flatMap(p => p.chatIds);
    const orphanedChats = chats.filter(chat => !allProjectChatIds.includes(chat.id));
    
    // Add orphaned chats to the active project
    orphanedChats.forEach(chat => {
      addChatToProject(activeProjectId, chat.id);
    });
  }, [isLoaded, chats, projects, activeProjectId, addChatToProject]);

  // Get the active project
  const activeProject = projects.find(p => p.id === activeProjectId);
  
  // Filter chats that belong to the active project
  const projectChats = activeProject 
    ? chats.filter(chat => activeProject.chatIds.includes(chat.id))
    : [];

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {isLoaded ? (
        <>
          <ProjectSelector />
          <div className="flex max-h-lvh max-w-full flex-1 flex-row gap-2 overflow-x-auto p-2">
            {projectChats.map((chat) => (
              <ChatPanel key={chat.id} chatId={chat.id} />
            ))}
            {projectChats.length === 0 && activeProject && (
              <div className="flex w-full items-center justify-center">
                <Button 
                  onClick={() => {
                    const newChatId = useChatStore.getState().addChat();
                    addChatToProject(activeProject.id, newChatId);
                    useChatStore.getState().setActiveChat(newChatId);
                  }}
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Chat to Project
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex w-full flex-col items-center justify-center gap-4">
          <div className="flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm font-medium text-muted-foreground">Loading chats...</p>
          </div>
        </div>
      )}
    </main>
  );
}
