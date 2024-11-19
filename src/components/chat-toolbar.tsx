import { useChatStore } from "@/stores/chat-store";
import { ResponseMetrics } from "@/types/response-metrics.type";
import { Check, Plus, RefreshCcw, ScatterChart, Sheet } from "lucide-react";
import { useState } from "react";
import { CSVLink } from "react-csv";
import { MetricsChartData, MetricsChartWindow } from "./metrics-chart-window";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger } from "./ui/menubar";

export function ChatToolbar() {
  const chats = useChatStore((state) => state.chats);
  const addChat = useChatStore((state) => state.addChat);
  const resetChats = useChatStore((state) => state.resetChats);
  const [showChart, setShowChart] = useState(false);

  const csvData = chats.flatMap((chat) => {
    const assistantMessages = chat.messages?.filter((m) => m.role === "assistant") ?? [];

    return assistantMessages.map((m) => {
      const metrics = m.data as ResponseMetrics;

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

  const chartData = chats.map((chat) => {
    const assistantMessages = chat.messages?.filter((m) => m.role === "assistant") ?? [];

    const metricsData = assistantMessages
      .map((m) => m.data as ResponseMetrics)
      .map(
        (m) =>
          ({
            cost: m?.cost ?? 0,
            firstTokenTime: m?.firstTokenTime ?? 0,
            inputTokens: m?.inputTokens ?? 0,
            outputTokens: m?.outputTokens ?? 0,
            responseTime: m?.responseTime ?? 0,
          }) satisfies Required<ResponseMetrics>,
      );

    const totalCost = metricsData.reduce((acc, curr) => acc + curr.cost, 0);
    const avgTokensPerSecond = metricsData.reduce(
      (acc, curr) => acc + curr.outputTokens / ((curr.responseTime - curr.firstTokenTime) / 1000) / metricsData.length,
      0,
    );

    return {
      name: chat.model.name,
      cost: totalCost,
      tokensPerSecond: avgTokensPerSecond,
      totalTokens: metricsData.reduce((acc, curr) => acc + curr.outputTokens, 0),
    } satisfies MetricsChartData;
  });

  return (
    <>
      <Menubar className="bg-muted dark:bg-background">
        <MenubarMenu>
          <MenubarTrigger className="text-xs">Models</MenubarTrigger>
          <MenubarContent className="*:!text-xs">
            <MenubarItem onClick={() => addChat()}>
              <Plus className="mr-2 size-4" />
              Add Model
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => resetChats()}>
              <RefreshCcw className="mr-2 size-4" />
              Clear Chats
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        {/* <MenubarMenu>
        <MenubarTrigger className="text-xs">Prompt</MenubarTrigger>
        <MenubarContent className="*:!text-xs">
          <MenubarItem>Load</MenubarItem>
          <MenubarItem>Save</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Delete</MenubarItem>
        </MenubarContent>
      </MenubarMenu> */}

        <MenubarMenu>
          <MenubarTrigger className="text-xs">Compare</MenubarTrigger>
          <MenubarContent className="*:!text-xs">
            <MenubarItem onClick={() => setShowChart(!showChart)}>
              <ScatterChart className="mr-2 h-4 w-4" />
              Show Chart
              {showChart && <Check className="ml-auto h-4 w-4" />}
            </MenubarItem>
            <MenubarItem>
              <CSVLink data={csvData} filename="results.csv" className="flex items-center">
                <Sheet className="mr-2 h-4 w-4" />
                Export Results
              </CSVLink>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      {showChart && <MetricsChartWindow metrics={chartData} onClose={() => setShowChart(false)} />}
    </>
  );
}
