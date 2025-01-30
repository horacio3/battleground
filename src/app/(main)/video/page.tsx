"use client";

import { Button } from "@/components/ui/button";
import { VideoPanel, VideoResult } from "@/components/video-panel";
import { VideoModel } from "@/lib/model/model.type";
import { videoModels } from "@/lib/model/models";
import { SendHorizonal, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";

export default function Video() {
  const [model, setModel] = useLocalStorage<VideoModel>("videoModel", videoModels[0]);
  const [input, setInput] = useLocalStorage<string>("videoPrompt", "");
  const [invocationArn, setInvocationArn] = useLocalStorage<string | null>("videoInvocationArn", null);
  const [loading, setLoading] = useState(invocationArn ? true : false);
  const [result, setResult] = useState<VideoResult | undefined>();

  const startVideoGeneration = () => {
    if (loading) return;
    setLoading(true);
    setResult(undefined);

    fetch("/api/video", {
      method: "POST",
      body: JSON.stringify({
        modelId: model.id,
        message: { content: input, role: "user" },
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setInvocationArn(data.invocationArn);
      })
      .catch((err) => {
        toast.error(err.message);
        setLoading(false);
        setInvocationArn(null);
      });
  };

  const checkVideoGeneration = async () => {
    if (!invocationArn) return;

    const res = await fetch("/api/video?" + new URLSearchParams({ modelId: model.id, invocationArn }))
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .catch((err) => {
        toast.error(err.message);
        setLoading(false);
        setInvocationArn(null);
        return null;
      });

    if (!res) return;

    const output = res as VideoResult;

    switch (output.status) {
      case "Completed":
        setResult(output);
        setLoading(false);
        break;
      case "Failed":
        console.error(output);
        toast.error("Video generation failed");
        setLoading(false);
        break;
      case "InProgress":
        setLoading(true);
        break;
    }
  };

  useEffect(() => {
    if (!invocationArn) return;
    if (result?.status === "Completed") return;

    const interval = setInterval(() => checkVideoGeneration(), 2000);
    return () => clearInterval(interval);
  }, [invocationArn, result]);

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2">
      <div className="rounded-md border p-2 focus-within:border-ring">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground">Prompt</p>
            <Sparkles className="h-3 w-3" />
          </div>
          <div className="ml-auto flex flex-row items-center gap-2">
            <Button variant="ghost" size="xsicon" disabled={!input} title="Clear prompt" onClick={() => setInput("")}>
              <Trash2 className="size-4" />
            </Button>
            <Button variant="ghost" size="xsicon" disabled={!input || loading} onClick={() => startVideoGeneration()}>
              <SendHorizonal className="size-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <TextareaAutosize
            placeholder="Start typing a prompt for the AI models, then hit Execute to see the results."
            maxRows={10}
            minRows={3}
            disabled={loading}
            className="w-full resize-none bg-transparent text-sm font-light focus:outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                startVideoGeneration();
              }
            }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-row gap-2 overflow-x-auto overflow-y-hidden">
        <VideoPanel loading={loading} model={model} setModel={setModel} result={result} />
      </div>
    </main>
  );
}
