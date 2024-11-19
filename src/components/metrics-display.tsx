import { ResponseMetrics } from "@/types/response-metrics.type";
import { Badge } from "./ui/badge";

export const MetricsDisplay = (data: Partial<ResponseMetrics>) => {
  return (
    <div className="flex flex-wrap gap-1">
      {!!data.firstTokenTime && (
        <Badge variant="outline" className="text-nowrap font-light" title="Time to first token">
          TTFT:&nbsp;<span>{data.firstTokenTime} ms</span>
        </Badge>
      )}
      {!!data.responseTime && (
        <Badge variant="outline" className="text-nowrap font-light" title="Total response time">
          Time:&nbsp;<span>{data.responseTime} ms</span>
        </Badge>
      )}
      {!!data.inputTokens && (
        <Badge variant="outline" className="text-nowrap font-light" title="Total input tokens">
          Input:&nbsp;<span>{data.inputTokens} tkns</span>
        </Badge>
      )}
      {!!data.outputTokens && (
        <Badge variant="outline" className="text-nowrap font-light" title="Total output tokens">
          Output:&nbsp;<span>{data.outputTokens} tkns</span>
        </Badge>
      )}
      {!!data.cost && (
        <Badge variant="outline" className="text-nowrap font-light" title="Estimated cost">
          Cost:&nbsp;
          <span>${data.cost?.toPrecision(1)}</span>
        </Badge>
      )}
    </div>
  );
};
