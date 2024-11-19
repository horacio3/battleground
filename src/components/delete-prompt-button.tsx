import { usePromptStore } from "@/stores/prompt-store";
import { DeletePromptCommandOutput } from "@aws-sdk/client-bedrock-agent";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function DeletePromptButton() {
  const prompt = usePromptStore((state) => state.prompt);
  const setPromptText = usePromptStore((state) => state.setPromptText);
  const queryClient = useQueryClient();

  const deletePrompt = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await fetch(`/api/prompt/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const { message } = await res.json();
        throw new Error(message ?? "Failed to delete prompt");
      }
      return (await res.json()) as DeletePromptCommandOutput;
    },
    onSuccess: () => {
      toast.success("Prompt deleted successfully");
      setPromptText("");
    },
    onError: (error) => toast.error(error.message),
    // reload the prompt list after deleting a prompt
    onSettled: () => queryClient.invalidateQueries(),
  });

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="xsicon" className="text-red-500 hover:text-red-500">
              <Trash2 className="size-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" className="invert">
          Delete Prompt
        </TooltipContent>
      </Tooltip>
      <DialogContent className="p-4">
        <DialogTitle>Delete Prompt</DialogTitle>
        <div className="flex flex-col gap-4">
          <p className="text-sm">
            {"Are you sure you want to delete prompt "}
            <b>{prompt.name}</b>?
          </p>
          <div className="flex flex-row justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost" className="mt-2" size="sm">
                Cancel
              </Button>
            </DialogClose>

            <DialogClose asChild>
              <Button
                variant="destructive"
                onClick={() => deletePrompt.mutate({ id: prompt.id ?? "" })}
                className="mt-2"
                size="sm"
              >
                Delete
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
