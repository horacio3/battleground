import { nanoid } from "nanoid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { useChatStore } from "./chat-store";

export type Project = {
  id: string;
  name: string;
  chatIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

type ProjectStoreState = {
  // State
  projects: Project[];
  activeProjectId: string | null;
  
  // Actions
  addProject: (name: string) => string;
  renameProject: (id: string, name: string) => void;
  removeProject: (id: string) => void;
  setActiveProject: (id: string) => void;
  addChatToProject: (projectId: string, chatId: string) => void;
  removeChatFromProject: (projectId: string, chatId: string) => void;
};

export const useProjectStore = create<ProjectStoreState>()(
  persist(
    immer((set) => ({
      projects: [],
      activeProjectId: null,

      addProject: (name: string) => {
        // Generate ID outside of set to avoid any state inconsistencies
        const newId = nanoid();
        const now = new Date();
        
        // Create a default chat for this project first
        const chatId = useChatStore.getState().addChat();
        
        // Then update the project store in a single operation
        set((state) => {
          state.projects.push({
            id: newId,
            name,
            chatIds: [chatId], // Add the chat ID directly here
            createdAt: now,
            updatedAt: now,
          });
          state.activeProjectId = newId;
        });
        
        // Set the newly created chat as active
        setTimeout(() => {
          useChatStore.getState().setActiveChat(chatId);
        }, 0);
        
        return newId;
      },

      renameProject: (id: string, name: string) =>
        set((state) => {
          const projectIndex = state.projects.findIndex((p) => p.id === id);
          if (projectIndex === -1) return;
          state.projects[projectIndex].name = name;
          state.projects[projectIndex].updatedAt = new Date();
        }),

      removeProject: (id: string) =>
        set((state) => {
          const projectIndex = state.projects.findIndex((p) => p.id === id);
          if (projectIndex === -1) return;
          
          // Get the chat IDs associated with this project before removing it
          const chatIdsToRemove = [...state.projects[projectIndex].chatIds];
          
          // Remove the project
          state.projects.splice(projectIndex, 1);
          
          // If we removed the active project, set a new active project
          if (state.activeProjectId === id) {
            state.activeProjectId = state.projects.length > 0 ? state.projects[0].id : null;
          }
          
          // Remove the orphaned chats
          chatIdsToRemove.forEach(chatId => {
            useChatStore.getState().removeChat(chatId);
          });
        }),

      setActiveProject: (id: string) =>
        set((state) => {
          const projectExists = state.projects.some((p) => p.id === id);
          if (!projectExists) return;
          
          // Get the project we're switching to
          const project = state.projects.find(p => p.id === id);
          state.activeProjectId = id;
          
          // Set the active chat to the first chat in the project if available
          if (project && project.chatIds.length > 0) {
            const chatId = project.chatIds[0];
            // Make sure the chat exists in the chat store
            const chatExists = useChatStore.getState().chats.some(c => c.id === chatId);
            if (chatExists) {
              useChatStore.getState().setActiveChat(chatId);
            }
          }
        }),

      addChatToProject: (projectId: string, chatId: string) =>
        set((state) => {
          const projectIndex = state.projects.findIndex((p) => p.id === projectId);
          if (projectIndex === -1) return;
          
          // Only add if not already in the project
          if (!state.projects[projectIndex].chatIds.includes(chatId)) {
            state.projects[projectIndex].chatIds.push(chatId);
            state.projects[projectIndex].updatedAt = new Date();
          }
        }),

      removeChatFromProject: (projectId: string, chatId: string) =>
        set((state) => {
          const projectIndex = state.projects.findIndex((p) => p.id === projectId);
          if (projectIndex === -1) return;
          
          state.projects[projectIndex].chatIds = state.projects[projectIndex].chatIds.filter(
            (id) => id !== chatId
          );
          state.projects[projectIndex].updatedAt = new Date();
        }),
    })),
    {
      name: "project-store",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);