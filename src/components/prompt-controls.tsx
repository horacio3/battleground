import { usePrompt } from "@/hooks/use-prompt";
import { usePromptStore } from "@/stores/prompt-store";
import { Loader2, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { PromptSelect } from "./prompt-select";
import { CreatePromptButton, UpdatePromptButton } from "./save-prompt-button";
import { Badge } from "./ui/badge";

export const PromptControls = () => {
  const prompt = usePromptStore((state) => state.prompt);
  const setPromptSummary = usePromptStore((state) => state.setPromptSummary);
  const setPromptText = usePromptStore((state) => state.setPromptText);

  const { data: promptDetails, isLoading } = usePrompt({ id: prompt.id });

  useEffect(() => {
    setPromptText(promptDetails?.variants?.[0].templateConfiguration?.text?.text ?? "");
  }, [promptDetails, setPromptText]);

  return (
    <div className="flex flex-row items-center gap-2">
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        prompt.id && (
          <Badge variant="outline" className="flex flex-row items-center gap-1 uppercase">
            <Link className="hover:underline" href={`/prompt/edit/${prompt.id}`}>
              {prompt.name}
            </Link>
            <X onClick={() => setPromptSummary()} className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </Badge>
        )
      )}
      <PromptSelect />
      {prompt.id ? (
        <>
          <UpdatePromptButton />
        </>
      ) : prompt.text ? (
        <CreatePromptButton />
      ) : undefined}
    </div>
  );
};
