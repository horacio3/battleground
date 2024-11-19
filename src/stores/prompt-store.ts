import { TextModel } from "@/lib/model/model.type";
import { textModels } from "@/lib/model/models";
import { ImageData } from "@/types/image-data.type";
import { ResponseMetrics } from "@/types/response-metrics.type";
import { PromptSummary } from "@aws-sdk/client-bedrock-agent";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { ChatParams } from "./chat-store";

export type Prompt = Partial<PromptSummary> & { text: string; attachments: ImageData[] };

type PromptStoreState = {
  // State
  prompt: Prompt;
  results: {
    id: string;
    model: TextModel;
    output: string;
    metrics?: ResponseMetrics;
  }[];
  // Actions
  addResults: () => void;
  removeResults: (id: string) => void;
  clearResults: (id?: string) => void;
  setResultsOutput: (id: string, text: string) => void;
  setResultsMetrics: (id: string, metrics: ResponseMetrics) => void;
  setModel: (id: string, model: TextModel) => void;
  updateModelParams: (id: string, params: ChatParams) => void;
  setPromptSummary: (summary?: PromptSummary) => void;
  setPromptText: (text: string) => void;
  addAttachmentToPrompt: (attachment: ImageData) => void;
  removeAttachmentFromPrompt: (name: string) => void;
};

export const usePromptStore = create<PromptStoreState>()(
  persist(
    immer((set) => ({
      prompt: {
        text: "",
        attachments: [],
      },
      results: [
        {
          id: nanoid(),
          model: textModels[0],
          output: "",
        },
      ],

      addResults: () => {
        set((state) => {
          state.results.push({
            id: nanoid(),
            model: textModels[0],
            output: "",
          });
        });
      },

      removeResults: (id: string) => {
        set((state) => {
          const idx = state.results.findIndex((m) => m.id === id);
          if (idx === -1) return;
          state.results.splice(idx, 1);
          if (state.results.length === 0) {
            state.results.push({
              id: nanoid(),
              model: textModels[0],
              output: "",
            });
          }
        });
      },

      clearResults: (id?: string) => {
        set((state) => {
          if (!id) {
            state.results.forEach((result) => (result.output = ""));
            return;
          }
          const idx = state.results.findIndex((m) => m.id === id);
          if (idx === -1) return;
          state.results[idx].output = "";
        });
      },

      setResultsOutput: (id: string, text: string) => {
        set((state) => {
          const idx = state.results.findIndex((m) => m.id === id);
          if (idx === -1) return;
          state.results[idx].output = text;
        });
      },

      setResultsMetrics: (id: string, metrics: ResponseMetrics) => {
        set((state) => {
          const idx = state.results.findIndex((m) => m.id === id);
          if (idx === -1) return;
          state.results[idx].metrics = metrics;
        });
      },

      setModel: (id: string, model: TextModel) => {
        set((state) => {
          const idx = state.results.findIndex((m) => m.id === id);
          if (idx === -1) return;
          state.results[idx].model = model;
        });
      },

      updateModelParams: (id: string, params: ChatParams) => {
        set((state) => {
          const idx = state.results.findIndex((m) => m.id === id);
          if (idx === -1) return;
          state.results[idx].model.config = {
            systemPrompt: params.systemPrompt ?? state.results[idx].model.config?.systemPrompt,
            maxTokens: {
              ...state.results[idx].model.config?.maxTokens,
              value: params.maxTokens ?? state.results[idx].model.config?.maxTokens.value,
            },
            temperature: {
              ...state.results[idx].model.config?.temperature,
              value: params.temperature ?? state.results[idx].model.config?.temperature.value,
            },
            topP: {
              ...state.results[idx].model.config?.topP,
              value: params.topP ?? state.results[idx].model.config?.topP.value,
            },
          };
        });
      },

      setPromptSummary: (summary?: PromptSummary) => {
        set((state) => {
          if (!summary) {
            state.prompt = { text: "", attachments: [] };
          } else {
            state.prompt = { ...state.prompt, ...summary };
          }
        });
      },

      setPromptText: (text: string) => {
        set((state) => {
          state.prompt.text = text;
        });
      },

      addAttachmentToPrompt: (attachment: ImageData) => {
        set((state) => {
          state.prompt.attachments.push(attachment);
        });
      },

      removeAttachmentFromPrompt: (name: string) => {
        set((state) => {
          state.prompt.attachments = state.prompt.attachments.filter((a) => a.name !== name);
        });
      },
    })),
    {
      name: "prompt-store",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => {
        return {
          results: state.results.map((result) => ({
            ...result,
            output: "",
            metrics: undefined,
          })),
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state?.results?.length === 0) {
          state.results.push({
            id: nanoid(),
            model: textModels[0],
            output: "",
          });
          return;
        }

        // handles legacy state
        state?.results.forEach((result) => {
          if (Array.isArray(result.model.config) || result.model.systemPromptSupport === undefined) {
            state.setModel(result.id, textModels.find((m) => m.id === result.model.id) ?? textModels[0]);
          }
        });
      },
    },
  ),
);

export const usePromptStoreHydrated = () => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Note: This is just in case you want to take into account manual rehydration.
    // You can remove the following line if you don't need it.
    const unsubHydrate = usePromptStore.persist.onHydrate(() => setHydrated(false));

    const unsubFinishHydration = usePromptStore.persist.onFinishHydration(() => setHydrated(true));

    setHydrated(usePromptStore.persist.hasHydrated());

    return () => {
      unsubHydrate();
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
};
