import { TextModel } from "@/lib/model/model.type";
import { textModels } from "@/lib/model/models";
import { useProjectStore } from "@/stores/project-store";
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
  codeInterpreter: {
    enabled: boolean;
    actionGroupName: string;
  };
  failedMessage?: {
    content: string;
    attachments: ImageData[];
    error: string;
    errorType: "network" | "credentials" | "api" | "unknown";
  };
  sessionId: string;
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
  activeChat: string;
  // Actions
  addChat: () => string;
  removeChat: (id: string) => void;
  resetChats: () => void;
  resetChat: (id: string) => string;
  setChatModel: (id: string, model: TextModel) => string;
  updateModelParams: (id: string, params: ChatParams) => void;
  setChatInput: (id: string, input: string) => void;
  addAttachmentToChat: (id: string, attachment: ImageData) => void;
  removeAttachmentFromChat: (id: string, attachment: ImageData) => void;
  resetChatInput: (id: string) => void;
  setChatSynced: (id: string, synced: boolean) => void;
  setChatMessages: (id: string, messages: Message[]) => void;
  setActiveChat: (id: string) => void;
  setFailedMessage: (id: string, failedMessage: Chat["failedMessage"]) => void;
  clearFailedMessage: (id: string) => void;
  setCodeInterpreter: (id: string, enabled: boolean) => void;
};

// Maximum number of chats to store in localStorage
const MAX_STORED_CHATS = 10;

export const useChatStore = create<ChatStoreState>()(
  persist(
    immer((set) => ({
      chats: [],
      activeChat: "",

      addChat: () => {
        let newChatId = "";
        set((state) => {
          newChatId = nanoid();
          const sessionId = `session-${newChatId}-${Date.now()}`;
          const newChat = {
            id: newChatId,
            model: textModels[0],
            input: "",
            attachments: [],
            synced: true, // Default sync ON
            messages: [],
            codeInterpreter: {
              enabled: false, // Default code interpreter OFF
              actionGroupName: "CodeInterpreterAction",
            },
            sessionId,
          };
          state.chats.push(newChat);

          // If this is the first chat, set it as active
          if (state.chats.length === 1) {
            state.activeChat = newChatId;
          }
          
          console.log(`[DEBUG] New chat created: ${newChatId} with code interpreter disabled by default`);
        });
        return newChatId;
      },

      removeChat: (id: string) =>
        set((state) => {
          const chatIndex = state.chats.findIndex((chat) => chat.id === id);
          if (chatIndex === -1) return state;

          // Check if we're removing the active chat
          const isActiveChat = state.activeChat === id;
          
          // Clean up session data
          const sessionId = state.chats[chatIndex].sessionId;
          if (sessionId) {
            // Use dynamic import to avoid issues with SSR
            import("@/lib/persist-session").then(({ clearSessionData }) => {
              clearSessionData(sessionId);
            });
          }

          state.chats.splice(chatIndex, 1);

          if (state.chats.length === 0) {
            const newChatId = nanoid();
            const sessionId = `session-${newChatId}-${Date.now()}`;
            const newChat = {
              id: newChatId,
              model: textModels[0],
              input: "",
              attachments: [],
              synced: true, // Default sync ON
              messages: [],
              codeInterpreter: {
                enabled: false, // Default code interpreter OFF
                actionGroupName: "CodeInterpreterAction",
              },
              sessionId,
            };
            state.chats.push(newChat);
            state.activeChat = newChatId;
          } else if (isActiveChat) {
            // Set active chat to the first available chat
            state.activeChat = state.chats[0].id;
          }
        }),

      setChatModel: (id: string, model: TextModel) => {
        let oldChatId = id;
        let newChatId = "";

        set((state) => {
          const chatIndex = state.chats.findIndex((chat) => chat.id === id);
          if (chatIndex === -1) return state;

          // Store the old chat ID
          oldChatId = state.chats[chatIndex].id;

          // Generate a new ID for the chat
          newChatId = nanoid();

          // Update the chat with the new model and reset its state
          state.chats[chatIndex].model = model;
          state.chats[chatIndex].id = newChatId;
          state.chats[chatIndex].input = "";
          state.chats[chatIndex].attachments = [];
          state.chats[chatIndex].messages = [];
        });

        // Update any project references to this chat
        const projects = useProjectStore.getState().projects;
        projects.forEach((project) => {
          const chatIndex = project.chatIds.indexOf(oldChatId);
          if (chatIndex !== -1) {
            useProjectStore.getState().removeChatFromProject(project.id, oldChatId);
            useProjectStore.getState().addChatToProject(project.id, newChatId);
          }
        });

        return newChatId;
      },

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
        let oldChatId = id;
        let newChatId = "";

        set((state) => {
          const chatIndex = state.chats.findIndex((chat) => chat.id === id);
          if (chatIndex === -1) return state;

          // Store the old chat ID and session ID
          oldChatId = state.chats[chatIndex].id;
          const oldSessionId = state.chats[chatIndex].sessionId;
          
          // Clean up old session data
          if (oldSessionId) {
            import("@/lib/persist-session").then(({ clearSessionData }) => {
              clearSessionData(oldSessionId);
            });
          }

          // Generate a new ID for the chat
          newChatId = nanoid();
          const newSessionId = `session-${newChatId}-${Date.now()}`;

          // changing the chat id will reset the chat within the useChat hook
          state.chats[chatIndex].id = newChatId;
          state.chats[chatIndex].input = "";
          state.chats[chatIndex].attachments = [];
          state.chats[chatIndex].messages = [];
          state.chats[chatIndex].sessionId = newSessionId;
          
          // Keep the code interpreter setting as is
          // This preserves the user's preference when clearing a chat
        });

        // Update any project references to this chat
        const projects = useProjectStore.getState().projects;
        projects.forEach((project) => {
          const chatIndex = project.chatIds.indexOf(oldChatId);
          if (chatIndex !== -1) {
            useProjectStore.getState().removeChatFromProject(project.id, oldChatId);
            useProjectStore.getState().addChatToProject(project.id, newChatId);
          }
        });

        return newChatId;
      },

      resetChats: () => {
        // Get the active project
        const activeProjectId = useProjectStore.getState().activeProjectId;
        if (!activeProjectId) return;

        // Get the active project's chat IDs
        const project = useProjectStore.getState().projects.find((p) => p.id === activeProjectId);
        if (!project) return;

        const oldChatIds = [];
        const newChatIds = [];
        const oldSessionIds = [];

        set((state) => {
          // Only reset chats in the current project
          for (const chat of state.chats) {
            if (project.chatIds.includes(chat.id)) {
              // Store the old chat ID and session ID
              oldChatIds.push(chat.id);
              if (chat.sessionId) {
                oldSessionIds.push(chat.sessionId);
              }

              // Generate a new ID for the chat
              const newId = nanoid();
              newChatIds.push(newId);
              const newSessionId = `session-${newId}-${Date.now()}`;

              // changing the chat id will reset the chat within the useChat hook
              chat.id = newId;
              chat.input = "";
              chat.attachments = [];
              chat.messages = [];
              chat.sessionId = newSessionId;
              
              // Keep the code interpreter setting as is
              // This preserves the user's preference when clearing chats
            }
          }
        });
        
        // Clean up old session data
        if (oldSessionIds.length > 0) {
          import("@/lib/persist-session").then(({ clearSessionData }) => {
            oldSessionIds.forEach(sessionId => {
              clearSessionData(sessionId);
            });
          });
        }

        // Update project references for the reset chats
        oldChatIds.forEach((oldId, index) => {
          useProjectStore.getState().removeChatFromProject(activeProjectId, oldId);
          useProjectStore.getState().addChatToProject(activeProjectId, newChatIds[index]);
        });
      },

      setChatInput: (id: string, input: string) => {
        set((state) => {
          const chatIndex = state.chats.findIndex((chat) => chat.id === id);
          if (chatIndex === -1) return state;

          // Get the active project
          const activeProjectId = useProjectStore.getState().activeProjectId;
          if (!activeProjectId) {
            // If no active project, just update this chat
            state.chats[chatIndex].input = input;
            return;
          }

          // Get the active project's chat IDs
          const project = useProjectStore.getState().projects.find((p) => p.id === activeProjectId);
          if (!project) {
            // If project not found, just update this chat
            state.chats[chatIndex].input = input;
            return;
          }

          // If the chat is synced, update all chats in the same project
          if (state.chats[chatIndex].synced) {
            for (const chat of state.chats) {
              if (project.chatIds.includes(chat.id) && chat.synced && chat.model.inputModalities.includes("TEXT")) {
                chat.input = input;
              }
            }
          } else {
            // Otherwise just update this chat
            state.chats[chatIndex].input = input;
          }
        });
      },

      addAttachmentToChat: (id: string, attachment: ImageData) => {
        set((state) => {
          const chatIndex = state.chats.findIndex((chat) => chat.id === id);
          if (chatIndex === -1) return state;

          // Get the active project
          const activeProjectId = useProjectStore.getState().activeProjectId;
          if (!activeProjectId) {
            // If no active project, just update this chat
            state.chats[chatIndex].attachments.push(attachment);
            return;
          }

          // Get the active project's chat IDs
          const project = useProjectStore.getState().projects.find((p) => p.id === activeProjectId);
          if (!project) {
            // If project not found, just update this chat
            state.chats[chatIndex].attachments.push(attachment);
            return;
          }

          // If the chat is synced, update all chats in the same project
          if (state.chats[chatIndex].synced) {
            for (const chat of state.chats) {
              if (project.chatIds.includes(chat.id) && chat.synced && chat.model.inputModalities.includes("IMAGE")) {
                chat.attachments.push(attachment);
              }
            }
          } else {
            // Otherwise just update this chat
            state.chats[chatIndex].attachments.push(attachment);
          }
        });
      },

      removeAttachmentFromChat: (id: string, attachment: ImageData) => {
        set((state) => {
          const chatIndex = state.chats.findIndex((chat) => chat.id === id);
          if (chatIndex === -1) return state;

          // Get the active project
          const activeProjectId = useProjectStore.getState().activeProjectId;
          if (!activeProjectId) {
            // If no active project, just update this chat
            state.chats[chatIndex].attachments = state.chats[chatIndex].attachments.filter(
              (a) => a.name !== attachment.name,
            );
            return;
          }

          // Get the active project's chat IDs
          const project = useProjectStore.getState().projects.find((p) => p.id === activeProjectId);
          if (!project) {
            // If project not found, just update this chat
            state.chats[chatIndex].attachments = state.chats[chatIndex].attachments.filter(
              (a) => a.name !== attachment.name,
            );
            return;
          }

          // If the chat is synced, update all chats in the same project
          if (state.chats[chatIndex].synced) {
            for (const chat of state.chats) {
              if (project.chatIds.includes(chat.id) && chat.synced) {
                chat.attachments = chat.attachments.filter((a) => a.name !== attachment.name);
              }
            }
          } else {
            // Otherwise just update this chat
            state.chats[chatIndex].attachments = state.chats[chatIndex].attachments.filter(
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

      setActiveChat: (id: string) =>
        set((state) => {
          const chatExists = state.chats.some((chat) => chat.id === id);
          if (!chatExists) {
            // If the chat doesn't exist, create a new one
            const newChatId = nanoid();
            state.chats.push({
              id: newChatId,
              model: textModels[0],
              input: "",
              attachments: [],
              synced: true, // Default sync ON
              messages: [],
              codeInterpreter: {
                enabled: false, // Default code interpreter OFF
                actionGroupName: "CodeInterpreterAction",
              },
              sessionId: `session-${newChatId}-${Date.now()}`,
            });
            state.activeChat = newChatId;
          } else {
            state.activeChat = id;
          }
        }),

      setFailedMessage: (id: string, failedMessage: Chat["failedMessage"]) => {
        set((state) => {
          const chatIndex = state.chats.findIndex((chat) => chat.id === id);
          if (chatIndex === -1) return state;
          state.chats[chatIndex].failedMessage = failedMessage;
        });
      },

      clearFailedMessage: (id: string) => {
        set((state) => {
          const chatIndex = state.chats.findIndex((chat) => chat.id === id);
          if (chatIndex === -1) return state;
          state.chats[chatIndex].failedMessage = undefined;
        });
      },

      setCodeInterpreter: (id: string, enabled: boolean) =>
        set((state) => {
          const chatIndex = state.chats.findIndex((chat) => chat.id === id);
          if (chatIndex === -1) {
            // If chat doesn't exist, create it first
            state.chats.push({
              id,
              model: textModels[0],
              input: "",
              attachments: [],
              synced: true,
              messages: [],
              codeInterpreter: {
                enabled, // Use the provided enabled state
                actionGroupName: "CodeInterpreterAction",
              },
              sessionId: `session-${id}-${Date.now()}`,
            });
          } else {
            // Initialize codeInterpreter if it doesn't exist
            if (!state.chats[chatIndex].codeInterpreter) {
              state.chats[chatIndex].codeInterpreter = {
                enabled: false, // Default to OFF
                actionGroupName: "CodeInterpreterAction",
              };
            }
            // Update the enabled state
            state.chats[chatIndex].codeInterpreter.enabled = enabled;
            
            // Log the change for debugging
            console.log(`[DEBUG] Code interpreter ${enabled ? 'enabled' : 'disabled'} for chat ${id}`);
          }
        }),
    })),
    {
      name: "chat-store",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      // don't store messages or attachments in local storage
      partialize: (state) => {
        // Limit the number of chats stored in localStorage to prevent quota issues
        const chatsToStore = [...state.chats];

        // Sort chats by most recently used (based on message timestamps)
        chatsToStore.sort((a, b) => {
          const aLastMessage = a.messages[a.messages.length - 1]?.createdAt;
          const bLastMessage = b.messages[b.messages.length - 1]?.createdAt;

          if (!aLastMessage && !bLastMessage) return 0;
          if (!aLastMessage) return 1;
          if (!bLastMessage) return -1;

          return new Date(bLastMessage).getTime() - new Date(aLastMessage).getTime();
        });

        // Only store the MAX_STORED_CHATS most recent chats
        const limitedChats = chatsToStore.slice(0, MAX_STORED_CHATS);

        // Limit message history per chat to reduce storage size
        return {
          chats: limitedChats.map((chat) => ({
            ...chat,
            attachments: [], // Don't store attachments in localStorage
            failedMessage: chat.failedMessage
              ? {
                  ...chat.failedMessage,
                  attachments: [], // Don't store attachment data URLs in localStorage
                }
              : undefined,
            messages: [
              // Only store the last 20 messages per chat
              ...chat.messages.slice(-20).map((m) => ({
                ...m,
                data: m.role === "assistant" ? m.data : {},
              })),
            ],
          })),
          activeChat: state.activeChat,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state?.chats.length === 0) {
          const newChatId = nanoid();
          state.chats.push({
            id: newChatId,
            model: textModels[0],
            input: "",
            attachments: [],
            synced: true,
            messages: [],
            codeInterpreter: {
              enabled: false,
              actionGroupName: "CodeInterpreterAction",
            },
            sessionId: `session-${newChatId}-${Date.now()}`,
          });
          state.activeChat = newChatId;
          return;
        }

        // Set active chat to first chat if not set
        if (!state.activeChat && state.chats.length > 0) {
          state.activeChat = state.chats[0].id;
        }

        // handles legacy state
        state?.chats.forEach((chat, idx) => {
          if (Array.isArray(chat.model.config) || chat.model.systemPromptSupport === undefined) {
            state.setChatModel(chat.id, textModels.find((m) => m.id === chat.model.id) ?? textModels[0]);
          }
          if (!chat.sessionId) {
            chat.sessionId = `session-${chat.id}-${Date.now()}`;
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

// Helper function to clear localStorage when quota is exceeded
export const handleStorageError = () => {
  try {
    // Keep only essential data
    const activeChat = useChatStore.getState().activeChat;
    const currentChat = useChatStore.getState().chats.find((chat) => chat.id === activeChat);

    // Clear the entire store
    localStorage.removeItem("chat-store");

    // Reset the store with just the current chat if available
    if (currentChat) {
      useChatStore.setState({
        chats: [
          {
            ...currentChat,
            messages: currentChat.messages.slice(-10), // Keep only the last 10 messages
            attachments: [],
          },
        ],
        activeChat: currentChat.id,
      });
    }

    return true;
  } catch (e) {
    console.error("Failed to handle storage error:", e);
    return false;
  }
};
