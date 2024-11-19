import { useSub } from "@/lib/events";
import { imageModels } from "@/lib/model/models";
import { useImageStore } from "@/stores/image-store";
import { TooltipArrow } from "@radix-ui/react-tooltip";
import { EllipsisIcon, Loader2, PlusIcon, RefreshCcwIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MemoizedMarkdown } from "./markdown";
import { ModelConfigButton } from "./model-config-button";
import { ModelSelect } from "./model-select";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export const ImagePanel = ({ id }: { id: string }) => {
  const result = useImageStore((state) => state.results.find((m) => m.id === id))!;
  const addResults = useImageStore((state) => state.addResults);
  const removeResults = useImageStore((state) => state.removeResults);
  const setModel = useImageStore((state) => state.setModel);
  const setResultsOutput = useImageStore((state) => state.setResultsOutput);

  const [loading, setLoading] = useState(false);

  useSub("image-executed", (prompt) => {
    if (loading) return;

    setResultsOutput(result.id, "");
    setLoading(true);

    fetch("/api/image", {
      method: "POST",
      body: JSON.stringify({
        modelId: result.model.id,
        messages: [{ content: prompt, role: "user" }],
        config: result.model.config,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setResultsOutput(result.id, data.result);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  });

  return (
    <div className="min-width-[465px] flex flex-1 flex-col divide-y rounded-md border">
      <div className="flex flex-row items-center gap-2 bg-muted p-2 dark:bg-background">
        <ModelSelect
          models={imageModels}
          selectedModelId={result.model.id}
          onChange={(modelId) => setModel(result.id, imageModels.find((m) => m.id === modelId) ?? imageModels[0])}
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin self-center text-green-600" />}
        <div className="mr-auto" />
        <div className="flex flex-row items-center gap-2">
          {result.model.config && (
            <ModelConfigButton model={result.model} setModel={(model) => setModel(result.id, model)} />
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="xsicon" onClick={addResults}>
                <PlusIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="dark text-xs dark:invert">
              Add model for comparison
              <TooltipArrow />
            </TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="xsicon">
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-2">
              <DropdownMenuItem onClick={() => setResultsOutput(result.id, "")}>
                <RefreshCcwIcon className="mr-2 h-4 w-4" />
                Clear Chat
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500" onClick={() => removeResults(result.id)}>
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <MemoizedMarkdown response={result.output} className="flex flex-1 rounded-b-md p-2" />
    </div>
  );
};
