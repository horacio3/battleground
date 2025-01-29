"use client";

import { VideoModel } from "@/lib/model/model.type";
import { videoModels } from "@/lib/model/models";
import { GetAsyncInvokeCommandOutput } from "@aws-sdk/client-bedrock-runtime";
import humanizeDuration from "humanize-duration";
import { Loader2 } from "lucide-react";
import { ModelSelect } from "./model-select";

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
        {result && <span className="ml-2 text-xs text-muted-foreground">Took: {duration}</span>}
      </div>
      <div className="w-full p-2">
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
