import { useChatStore } from "@/stores/chat-store";
import { ResponseMetrics } from "@/types/response-metrics.type";
import { LineChart } from "lucide-react";
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from "recharts";
import colors from "tailwindcss/colors";
import { Button } from "./ui/button";
import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from "./ui/chart";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";

const dotColors = [
  colors.blue[500],
  colors.green[500],
  colors.amber[500],
  colors.red[500],
  colors.purple[500],
  colors.pink[500],
  colors.yellow[500],
  colors.cyan[500],
  colors.sky[500],
  colors.indigo[500],
];

export type MetricsChartData = {
  name: string;
  cost: number;
  tokensPerSecond: number;
  totalTokens: number;
};

export const MetricsChartPopoverButton = () => {
  const chats = useChatStore((state) => state.chats);

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

  const zDomain = [Math.min(...chartData.map((m) => m.totalTokens)), Math.max(...chartData.map((m) => m.totalTokens))];

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="ghost" size="icon">
          <LineChart className="size-4" />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="h-[500px] w-[500px]">
        <div className="flex h-[500px] w-[500px] flex-col p-2">
          <div className="mt-4 flex items-center justify-center">
            <h1 className="text-xl font-semibold">Model Comparison</h1>
          </div>
          <ChartContainer config={{ default: {} }} className="h-full w-full flex-1 p-4">
            <ScatterChart accessibilityLayer margin={{ right: 16, top: 16 }}>
              {/* <ReferenceArea x1={0} x2={0.0001} y1={0} y2={100} fill={colors.green[100]} /> */}
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="cost"
                name="Cost"
                interval={0}
                label={{ value: "Cost ($)", position: "insideBottom", offset: -16 }}
                tickMargin={8}
              />
              <YAxis type="number" dataKey="tokensPerSecond" name="Speed" unit=" t/s" width={48} />
              <ZAxis
                type="number"
                dataKey="totalTokens"
                name="Total Tokens"
                domain={zDomain}
                range={[40, 200]}
                scale="linear"
              />
              <ChartLegend wrapperStyle={{ paddingTop: 32, paddingLeft: 32, paddingBottom: 8 }} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} cursor={{ strokeDasharray: "3 3" }} />
              {chartData.map((entry, idx) => (
                <Scatter key={entry.name} name={entry.name} data={[entry]} fill={dotColors[idx]} />
              ))}
            </ScatterChart>
          </ChartContainer>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
