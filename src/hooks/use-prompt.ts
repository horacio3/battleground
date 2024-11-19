import { PromptBodyArgs } from "@/types/prompt-body-args";
import {
  CreatePromptCommandOutput,
  GetPromptCommandOutput,
  PromptSummary,
  UpdatePromptCommandOutput,
} from "@aws-sdk/client-bedrock-agent";
import { useMutation, UseMutationOptions, useQuery, useQueryClient } from "@tanstack/react-query";

export const usePrompts = () => {
  return useQuery({
    queryKey: ["prompts"],
    queryFn: async () => {
      const response = await fetch("/api/prompt");
      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message ?? "Failed to load prompts");
      }
      return (await response.json()) as PromptSummary[];
    },
  });
};

export const usePrompt = ({ id }: { id?: string }) => {
  return useQuery({
    queryKey: ["prompt", id],
    enabled: !!id,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await fetch(`/api/prompt/${id}`);
      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message ?? "Failed to load prompt");
      }
      return (await response.json()) as GetPromptCommandOutput;
    },
  });
};

export const useSavePrompt = (args: UseMutationOptions<CreatePromptCommandOutput, Error, PromptBodyArgs, unknown>) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...args,
    mutationFn: async (args: PromptBodyArgs) => {
      const res = await fetch(`/api/prompt/create`, {
        method: "POST",
        body: JSON.stringify(args),
      });

      if (!res.ok) {
        const { message } = await res.json();
        throw new Error(message ?? "Failed to create prompt");
      }

      return (await res.json()) as CreatePromptCommandOutput;
    },
    onSettled: () => queryClient.invalidateQueries(),
  });
};

export const useUpdatePrompt = (
  args: UseMutationOptions<UpdatePromptCommandOutput, Error, PromptBodyArgs & { id: string }>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...args,
    mutationFn: async ({ id, ...args }: PromptBodyArgs & { id: string }) => {
      const res = await fetch(`/api/prompt/${id}`, {
        method: "PUT",
        body: JSON.stringify(args),
      });

      if (!res.ok) {
        const { message } = await res.json();
        throw new Error(message ?? "Failed to save prompt");
      }

      return (await res.json()) as UpdatePromptCommandOutput;
    },
    onSettled: () => queryClient.invalidateQueries(),
  });
};

export const useDeletePrompt = (args: UseMutationOptions<void, Error, { id: string }>) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...args,
    mutationFn: async ({ id }: { id: string }) => {
      const res = await fetch(`/api/prompt/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const { message } = await res.json();
        throw new Error(message ?? "Failed to delete prompt");
      }
      return await res.json();
    },
    onMutate: ({ id }) => {
      queryClient.setQueryData<PromptSummary[]>(["prompts"], (oldData) => {
        return oldData?.filter((prompt) => prompt.id !== id) ?? [];
      });
    },
    onSettled: () => queryClient.invalidateQueries(),
  });
};
