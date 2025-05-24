import { TextModel } from "@/lib/model/model.type";
import { textModels } from "@/lib/model/models";
import { ImageData } from "@/types/image-data.type";
import { Message } from "ai";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type Chat = {
  id: string;
  model: TextModel;
  input: string;
  attachments: ImageData[];
  synced: boolean;
  messages: Message[];
  conversationId: string; // Added to associate with a conversation group
};

export type ChatParams = {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  reasoning?: {
    enabled: boolean;
    budgetTokens: number;
  };
};

type ChatStoreState = {
  // State
  chats: Chat[];
  // Actions
  addChat: (conversationId?: string) => void;
  removeChat: (id: string) => void;
  resetChats: (conversationId?: string) => void;
  resetChat: (id: string) => void;
  setChatModel: (id: string, model: TextModel) => void;
  updateModelParams: (id: string, params: ChatParams) => void;
  setChatInput: (id: string, input: string) => void;
  addAttachmentToChat: (id: string, attachment: ImageData) => void;
  removeAttachmentFromChat: (id: string, attachment: ImageData) => void;
  resetChatInput: (id: string) => void;
  setChatSynced: (id: string, synced: boolean) => void;
  setChatMessages: (id: string, messages: Message[]) => void;
  getChatsForConversation: (conversationId: string) => Chat[];
};

export const useChatStore = create<ChatStoreState>()(
  persist(
    immer((set, get) => ({
      chats: [
        {
          id: nanoid(),
          model: textModels[0],
          messages: [],
          input: "",
          attachments: [],
          synced: true,
          conversationId: "default", // Will be replaced by the first conversation group ID
        },
      ],

      addChat: (conversationId?: string) =>
        set((state) => {
          // Use the provided conversationId or the first chat's conversationId as default
          const targetConversationId = conversationId || 
            (state.chats.length > 0 ? state.chats[0].conversationId : "default");
          
          state.chats.push({
            id: nanoid(),
            model: textModels[0],
            input: "",
            attachments: [],
            synced: true,
            messages: [],
            conversationId: targetConversationId,
          });
        }),

      removeChat: (id: string) =>
        set((state) => {
          const chatIndex = state.chats.findIndex((chat) => chat.id === id);
          if (chatIndex === -1) return state;
          
          const conversationId = state.chats[chatIndex].conversationId;
          state.chats.splice(chatIndex, 1);
          
          // If we removed the last chat in this conversation, add a new one
          const conversationChats = state.chats.filter(chat => chat.conversationId === conversationId);
          if (conversationChats.length === 0) {
            state.chats.push({
              id: nanoid(),
              model: textModels[0],
              input: "",
              attachments: [],
              synced: true,
              messages: [],
              conversationId,
            });
          }
        }),
        
      getChatsForConversation: (conversationId: string) => {
        return get().chats.filter(chat => chat.conversationId === conversationId);
      },

      setChatModel: (id: string, model: TextModel) =>
        set((state) => {
          const chatIndex = state.chats.findIndex((chat) => chat.id === id);
          if (chatIndex === -1) return state;
          state.chats[chatIndex].model = model;
          state.chats[chatIndex].id = nanoid();
          state.chats[chatIndex].input = "";
          state.chats[chatIndex].attachments = [];
          state.chats[chatIndex].messages = [];
        }),

      updateModelParams: (id: string, params: ChatParams) => {
        set((state) => {
          const chatIndex = state.chats.findIndex((chat) => chat.id === id);
          if (chatIndex === -1) return state;
          state.chats[chatIndex].model.config = {
            systemPrompt: params.systemPrompt ?? state.chats[chatIndex].model.config?.systemPrompt,
            maxTokens: {
              ...state.chats[chatIndex].model.config?.maxTokens,
              value: params.maxTokens ?? state.chats[chatIndex].model.config?.maxTokens.value,
            },
            temperature: {
              ...state.chats[chatIndex].model.config?.temperature,
              value: params.temperature ?? state.chats[chatIndex].model.config?.temperature.value,
            },
            topP: {
              ...state.chats[chatIndex].model.config?.topP,
              value: params.topP ?? state.chats[chatIndex].model.config?.topP.value,
            },
            reasoning: {
              ...state.chats[chatIndex].model.config?.reasoning,
              enabled: params.reasoning?.enabled ?? state.chats[chatIndex].model.config?.reasoning?.enabled ?? false,
              budgetTokens: {
                min: 0,
                max: 4096,
                default: 1024,
                ...state.chats[chatIndex].model.config?.reasoning?.budgetTokens,
                value:
                  params.reasoning?.budgetTokens ??
                  state.chats[chatIndex].model.config?.reasoning?.budgetTokens?.value ??
                  1024,
              },
            },
          };
        });
      },

      resetChat: (id: string) => {
        set((state) => {
          const chatIndex = state.chats.findIndex((chat) => chat.id === id);
          if (chatIndex === -1) return state;
          // changing the chat id will reset the chat within the useChat hook
          state.chats[chatIndex].id = nanoid();
          state.chats[chatIndex].input = "";
          state.chats[chatIndex].attachments = [];
          state.chats[chatIndex].messages = [];
        });
      },

      resetChats: (conversationId?: string) => {
        set((state) => {
          for (const chat of state.chats) {
            // If conversationId is provided, only reset chats for that conversation
            if (!conversationId || chat.conversationId === conversationId) {
              // changing the chat id will reset the chat within the useChat hook
              chat.id = nanoid();
              chat.input = "";
              chat.attachments = [];
              chat.messages = [];
            }
          }
        });
      },

      setChatInput: (id: string, input: string) => {
        set((state) => {
          const chatIndex = state.chats.findIndex((chat) => chat.id === id);
          if (chatIndex === -1) return state;
          
          const currentChat = state.chats[chatIndex];
          const conversationId = currentChat.conversationId;
          
          if (currentChat.synced) {
            // Only sync with chats in the same conversation
            for (const chat of state.chats) {
              if (chat.synced && 
                  chat.conversationId === conversationId && 
                  chat.model.inputModalities.includes("TEXT")) {
                chat.input = input;
              }
            }
          } else {
            currentChat.input = input;
          }
        });
      },

      addAttachmentToChat: (id: string, attachment: ImageData) => {
        set((state) => {
          const chatIndex = state.chats.findIndex((chat) => chat.id === id);
          if (chatIndex === -1) return state;
          
          const currentChat = state.chats[chatIndex];
          const conversationId = currentChat.conversationId;
          
          if (currentChat.synced) {
            // Only sync with chats in the same conversation
            for (const chat of state.chats) {
              if (chat.synced && 
                  chat.conversationId === conversationId && 
                  chat.model.inputModalities.includes("IMAGE")) {
                chat.attachments.push(attachment);
              }
            }
          } else {
            currentChat.attachments.push(attachment);
          }
        });
      },

      removeAttachmentFromChat: (id: string, attachment: ImageData) => {
        set((state) => {
          const chatIndex = state.chats.findIndex((chat) => chat.id === id);
          if (chatIndex === -1) return state;
          
          const currentChat = state.chats[chatIndex];
          const conversationId = currentChat.conversationId;
          
          if (currentChat.synced) {
            // Only sync with chats in the same conversation
            for (const chat of state.chats) {
              if (chat.conversationId === conversationId) {
                chat.attachments = chat.attachments.filter((a) => a.name !== attachment.name);
              }
            }
          } else {
            currentChat.attachments = currentChat.attachments.filter(
              (a) => a.name !== attachment.name,
            );
          }
        });
      },

      resetChatInput: (id: string) => {
        set((state) => {
          const chatIndex = state.chats.findIndex((chat) => chat.id === id);
          if (chatIndex === -1) return state;
          state.chats[chatIndex].input = "";
          state.chats[chatIndex].attachments = [];
        });
      },

      setChatSynced: (id: string, synced: boolean) => {
        set((state) => {
          const chatIndex = state.chats.findIndex((chat) => chat.id === id);
          if (chatIndex === -1) return state;
          state.chats[chatIndex].synced = synced;
        });
      },

      setChatMessages: (id: string, messages: Message[]) => {
        set((state) => {
          const chatIndex = state.chats.findIndex((chat) => chat.id === id);
          if (chatIndex === -1) return state;
          // @ts-ignore
          state.chats[chatIndex].messages = messages;
        });
      },
    })),
    {
      name: "chat-store",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      // don't store messages or attachments in local storage
      partialize: (state) => {
        return {
          chats: state.chats.map((chat) => ({
            ...chat,
            attachments: [],
            messages: [
              ...chat.messages.map((m) => ({
                ...m,
                data: m.role === "assistant" ? m.data : {},
              })),
            ],
          })),
        };
      },
      onRehydrateStorage: () => (state) => {
        // Import the conversation store to get the default conversation ID
        const { useConversationStore } = require("./conversation-store");
        const defaultConversationId = useConversationStore.getState().activeConversationId || "default";
        
        if (state?.chats.length === 0) {
          state.chats.push({
            id: nanoid(),
            model: textModels[0],
            input: "",
            attachments: [],
            synced: true,
            messages: [],
            conversationId: defaultConversationId,
          });
          return;
        }
        
        // Ensure all chats have a conversationId
        state.chats.forEach(chat => {
          if (!chat.conversationId) {
            chat.conversationId = defaultConversationId;
          }
        });

        // handles legacy state
        state?.chats.forEach((chat, idx) => {
          if (Array.isArray(chat.model.config) || chat.model.systemPromptSupport === undefined) {
            state.setChatModel(chat.id, textModels.find((m) => m.id === chat.model.id) ?? textModels[0]);
          }
        });
      },
    },
  ),
);

export const useChatStoreHydrated = () => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Note: This is just in case you want to take into account manual rehydration.
    // You can remove the following line if you don't need it.
    const unsubHydrate = useChatStore.persist.onHydrate(() => setHydrated(false));

    const unsubFinishHydration = useChatStore.persist.onFinishHydration(() => setHydrated(true));

    setHydrated(useChatStore.persist.hasHydrated());

    return () => {
      unsubHydrate();
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
};
