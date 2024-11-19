import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Assuming you have an Input component
import { useSavePrompt, useUpdatePrompt } from "@/hooks/use-prompt";
import { usePromptStore } from "@/stores/prompt-store";
import { useUser } from "@clerk/nextjs";
import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function CreatePromptButton() {
  const prompt = usePromptStore((state) => state.prompt);
  const setPromptSummary = usePromptStore((state) => state.setPromptSummary);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isGlobal, setIsGlobal] = useState(false);
  const { user } = useUser();

  const savePrompt = useSavePrompt({
    onSuccess: (data) => {
      toast.success("Prompt created");
      setPromptSummary(data);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="xsicon">
              {savePrompt.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" className="invert">
          Save Prompt
        </TooltipContent>
      </Tooltip>
      <DialogContent className="p-4">
        <DialogTitle>Save Prompt</DialogTitle>
        <div className="flex flex-col gap-4">
          <Label>Name</Label>
          <Input
            placeholder="Enter prompt name"
            value={name}
            onChange={(e) => {
              const regex = /^[a-zA-Z0-9_-]{0,100}$/;
              setName(regex.test(e.target.value) ? e.target.value : name);
            }}
            className="w-full text-sm font-normal"
          />

          <Label>Description</Label>
          <Input
            placeholder="Enter prompt description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm font-normal"
          />

          <Label>Global</Label>
          <Checkbox checked={isGlobal} onCheckedChange={(checked) => setIsGlobal(checked === true)} />

          <div className="flex flex-row justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost" className="mt-2">
                Cancel
              </Button>
            </DialogClose>

            <DialogClose asChild>
              <Button
                onClick={() =>
                  savePrompt.mutate({
                    name,
                    description: description.length > 0 ? description : undefined,
                    prompt: prompt.text,
                    user: user?.primaryEmailAddress?.emailAddress,
                  })
                }
                className="mt-2"
              >
                Create
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UpdatePromptButton() {
  const { user } = useUser();
  const prompt = usePromptStore((state) => state.prompt);
  const setPromptSummary = usePromptStore((state) => state.setPromptSummary);

  const updatePrompt = useUpdatePrompt({
    onSuccess: (data) => {
      toast.success("Prompt saved");
      setPromptSummary(data);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="xsicon"
          onClick={() =>
            updatePrompt.mutate({
              id: prompt?.id ?? "",
              name: prompt.name ?? "",
              description: prompt.description,
              user: user?.primaryEmailAddress?.emailAddress,
              prompt: prompt.text,
            })
          }
        >
          {updatePrompt.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="invert">
        Save Prompt
      </TooltipContent>
    </Tooltip>
  );
}
