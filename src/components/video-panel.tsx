"use client";

import { VideoModel } from "@/lib/model/model.type";
import { videoModels } from "@/lib/model/models";
import { GetAsyncInvokeCommandOutput } from "@aws-sdk/client-bedrock-runtime";
import humanizeDuration from "humanize-duration";
import { AlertCircle, Loader2 } from "lucide-react";
import { ModelSelect } from "./model-select";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export type VideoResult = GetAsyncInvokeCommandOutput & { outputUrl?: string };

type VideoPanelProps = {
  model: VideoModel;
  setModel: (model: VideoModel) => void;
  loading: boolean;
  result?: VideoResult;
};

export const VideoPanel = ({ model, setModel, loading, result }: VideoPanelProps) => {
  const timeDiff = new Date(result?.endTime ?? 0).getTime() - new Date(result?.submitTime ?? 0).getTime();
  const duration = humanizeDuration(timeDiff);

  return (
    <div className="min-width-[465px] flex flex-1 flex-col rounded-md border">
      <div className="flex flex-row items-center gap-2 border-b bg-muted p-2 dark:bg-background">
        <ModelSelect
          models={videoModels}
          selectedModelId={model.id}
          onChange={(modelId) => setModel(videoModels.find((m) => m.id === modelId) ?? videoModels[0])}
        />
        {result && <span className="ml-2 mr-auto text-xs text-muted-foreground">Took: {duration}</span>}
        {/* {model.config.length > 0 && <ModelConfigButton model={model} setModel={(m) => setModel(m as VideoModel)} />} */}
      </div>
      <div className="w-full p-2">
        {model.id === "luma.ray-v2:0" && (
          <Alert className="mb-2 border-yellow-500 bg-yellow-500/10 py-2">
            <AlertCircle className="size-5 stroke-yellow-500" />
            <AlertTitle className="text-sm">Warning </AlertTitle>
            <AlertDescription className="text-xs">
              Each video costs $1.50 per second to generate! So use it wisely.
            </AlertDescription>
          </Alert>
        )}
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-8 animate-spin self-center text-green-600" />
          </div>
        ) : result?.outputUrl ? (
          <video src={result.outputUrl} controls className="aspect-video w-full rounded-md" />
        ) : undefined}
      </div>
    </div>
  );
};
