import { usePrompt, useSavePrompt, useUpdatePrompt } from "@/hooks/use-prompt";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

type PromptEditDialogProps = {
  promptId?: string;
  promptText?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const PromptEditDialog = ({ promptId, promptText, open, onOpenChange }: PromptEditDialogProps) => {
  const router = useRouter();
  const { user } = useUser();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: prompt } = usePrompt({ id: promptId });

  useEffect(() => {
    if (!prompt) return;
    setName(prompt.name ?? "");
    setDescription(prompt.description ?? "");
  }, [prompt]);

  const savePrompt = useSavePrompt({
    onSuccess: (data) => {
      router.replace(`/prompt/${data.id}?mode=edit`);
      toast.success("Prompt created");
    },
    onError: (error) => toast.error(error.message),
  });

  const updatePrompt = useUpdatePrompt({
    onSuccess: () => toast.success("Prompt updated"),
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Prompt Details</DialogTitle>
          <DialogDescription>Update the name, description, and scope of your prompt.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none"
            rows={2}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                if (promptId) {
                  updatePrompt.mutate({
                    id: promptId,
                    name,
                    description,
                    prompt: promptText ?? "",
                    user: user?.primaryEmailAddress?.emailAddress,
                  });
                } else {
                  savePrompt.mutate({
                    name,
                    description,
                    prompt: promptText ?? "",
                    user: user?.primaryEmailAddress?.emailAddress,
                  });
                }
              }}
            >
              Save
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
