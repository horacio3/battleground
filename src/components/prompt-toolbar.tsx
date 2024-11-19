import { usePromptStore } from "@/stores/prompt-store";
import { Check, Plus, RefreshCcw, ScatterChart, Sheet } from "lucide-react";
import { useState } from "react";
import { CSVLink } from "react-csv";
import { MetricsChartData, MetricsChartWindow } from "./metrics-chart-window";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger } from "./ui/menubar";

export function PromptToolbar() {
  const addModel = usePromptStore((state) => state.addResults);
  const clearModelResults = usePromptStore((state) => state.clearResults);
  const results = usePromptStore((state) => state.results);
  const [showChart, setShowChart] = useState(false);

  const csvData = results.map((r) => {
    const params = {
      systemPrompt: r.model.config?.systemPrompt ?? "",
      maxTokens: r.model.config?.maxTokens?.value ?? "",
      temperature: r.model.config?.temperature?.value ?? "",
      topP: r.model.config?.topP?.value ?? "",
    };

    return {
      messageId: r.id,
      modelId: r.model.id,
      modelParams: JSON.stringify(params).replace(/"/g, '""'),
      ...r.metrics,
    };
  });

  const metricsData = results.map((r) => {
    const outputTokens = r.metrics?.outputTokens ?? 0;
    const responseTime = r.metrics?.responseTime ?? 0;
    const firstTokenTime = r.metrics?.firstTokenTime ?? 0;

    return {
      name: r.model.name,
      cost: r.metrics?.cost ?? 0,
      tokensPerSecond: outputTokens / ((responseTime - firstTokenTime) / 1000),
      totalTokens: outputTokens,
    } satisfies MetricsChartData;
  });

  return (
    <>
      <Menubar className="bg-muted dark:bg-background">
        <MenubarMenu>
          <MenubarTrigger className="text-xs">Models</MenubarTrigger>
          <MenubarContent className="*:!text-xs">
            <MenubarItem onClick={() => addModel()}>
              <Plus className="mr-2 size-4" />
              Add Model
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => clearModelResults()}>
              <RefreshCcw className="mr-2 size-4" />
              Clear Results
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
      {showChart && <MetricsChartWindow metrics={metricsData} onClose={() => setShowChart(false)} />}
    </>
  );
}
