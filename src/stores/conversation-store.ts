import { nanoid } from "nanoid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type ConversationGroup = {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

type ConversationStoreState = {
  // State
  conversationGroups: ConversationGroup[];
  activeConversationId: string | null;
  // Actions
  addConversationGroup: (name: string, description?: string) => string;
  removeConversationGroup: (id: string) => void;
  updateConversationGroup: (id: string, name: string, description?: string) => void;
  setActiveConversationId: (id: string) => void;
};

export const useConversationStore = create<ConversationStoreState>()(
  persist(
    immer((set) => {
      // Generate a default conversation group ID
      const defaultId = nanoid();
      
      return {
        conversationGroups: [
          {
            id: defaultId,
            name: "Default Conversation",
            description: "Your first conversation",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        activeConversationId: defaultId,

        addConversationGroup: (name: string, description?: string) => {
          const id = nanoid();
          set((state) => {
            state.conversationGroups.push({
              id,
              name,
              description,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            state.activeConversationId = id;
          });
          return id;
        },

        removeConversationGroup: (id: string) =>
          set((state) => {
            const index = state.conversationGroups.findIndex((group) => group.id === id);
            if (index === -1) return;
            
            // Don't remove the last conversation group
            if (state.conversationGroups.length <= 1) return;
            
            state.conversationGroups.splice(index, 1);
            
            // If we removed the active conversation, set a new active conversation
            if (state.activeConversationId === id) {
              state.activeConversationId = state.conversationGroups[0]?.id || null;
            }
          }),

        updateConversationGroup: (id: string, name: string, description?: string) =>
          set((state) => {
            const group = state.conversationGroups.find((group) => group.id === id);
            if (!group) return;
            
            group.name = name;
            group.description = description;
            group.updatedAt = new Date();
          }),

        setActiveConversationId: (id: string) =>
          set((state) => {
            const exists = state.conversationGroups.some((group) => group.id === id);
            if (!exists) return;
            
            state.activeConversationId = id;
          }),
      };
    }),
    {
      name: "conversation-store",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);