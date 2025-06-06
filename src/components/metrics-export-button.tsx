import { useChatStore } from "@/stores/chat-store";
import { ResponseMetrics } from "@/types/response-metrics.type";
import { Download } from "lucide-react";
import { CSVLink } from "react-csv";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export const MetricsExportButton = () => {
  const chats = useChatStore((state) => state.chats);

  const csvData = chats.flatMap((chat) => {
    const assistantMessages = chat.messages?.filter((m) => m.role === "assistant") ?? [];

    return assistantMessages.map((m) => {
      const metrics = m.annotations?.[0] as ResponseMetrics;

      const params = {
        systemPrompt: chat.model.config?.systemPrompt ?? "",
        maxTokens: chat.model.config?.maxTokens?.value ?? "",
        temperature: chat.model.config?.temperature?.value ?? "",
        topP: chat.model.config?.topP?.value ?? "",
      };

      return {
        messageId: m.id,
        modelId: chat.model.id,
        modelParams: JSON.stringify(params).replace(/"/g, '""'),
        region: chat.model.region ?? "n/a",
        ...metrics,
      };
    });
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon">
          <CSVLink data={csvData} filename="results.csv" className="flex items-center">
            <Download className="size-4" />
            <span className="sr-only">Export Results</span>
          </CSVLink>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Export Results</TooltipContent>
    </Tooltip>
  );
};
