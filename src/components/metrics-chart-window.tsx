import NewWindow from "react-new-window";
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from "recharts";
import colors from "tailwindcss/colors";
import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from "./ui/chart";

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

export const MetricsChartWindow = ({ metrics, onClose }: { metrics: MetricsChartData[]; onClose?: () => void }) => {
  const zDomain = [Math.min(...metrics.map((m) => m.totalTokens)), Math.max(...metrics.map((m) => m.totalTokens))];

  return (
    <NewWindow onUnload={onClose} center="parent">
      <div className="flex h-full w-full flex-col p-2">
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
            {metrics.map((entry, idx) => (
              <Scatter key={entry.name} name={entry.name} data={[entry]} fill={dotColors[idx]} />
            ))}
          </ScatterChart>
        </ChartContainer>
      </div>
    </NewWindow>
  );
};
