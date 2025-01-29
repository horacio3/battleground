"use client";

import { Copy, Loader, Pause, PlayIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import { usePollyVoice } from "./settings-button";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export const ChatMessageButtons = ({ message }: { message: string }) => {
  const [audioLoading, setAudioLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement>();
  const [pollyVoice] = usePollyVoice();
  const [refetchAudio, setRefetchAudio] = useState(true);
  const [_, copyToClipboard] = useCopyToClipboard();

  useEffect(() => {
    if (message.length === 0) return;
    setRefetchAudio(true);
  }, [message, pollyVoice]);

  useEffect(() => {
    setAudio(new Audio());
  }, []);

  const playAudio = () => {
    if (message.length === 0) return;
    if (!audio) return;

    if (!refetchAudio) {
      audio.currentTime = 0;
      audio.play();
      return;
    }

    var content = message;

    setAudioLoading(true);

    // request the audio stream from the server
    fetch("/api/audio", {
      method: "POST",
      body: JSON.stringify({
        voiceId: pollyVoice,
        message: content,
      }),
    })
      .then(async (res) => {
        const data = await res.arrayBuffer();
        const blob = new Blob([data], { type: "audio/mpeg" });
        audio.src = URL.createObjectURL(blob);
        audio.load();
        audio.play();
      })
      .catch((err: Error) => {
        const { message } = JSON.parse(err.message);
        toast.error(message);
      })
      .finally(() => {
        setAudioLoading(false);
        setRefetchAudio(false);
      });
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="xsicon"
            onClick={() => {
              copyToClipboard(message);
              toast.success("Copied to clipboard");
            }}
            disabled={message.length === 0}
            className="h-6 w-6"
          >
            <Copy className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Copy message
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="xsicon"
            onClick={playAudio}
            disabled={message.length === 0 || !audio || audioLoading}
            className="h-6 w-6"
          >
            {audioLoading ? <Loader className="size-4 animate-spin" /> : <PlayIcon className="size-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Play audio
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="xsicon"
            onClick={() => {
              if (audio) {
                audio.pause();
                audio.currentTime = 0;
              }
            }}
            disabled={message.length === 0 || !audio}
            className="h-6 w-6"
          >
            <Pause className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Pause audio
        </TooltipContent>
      </Tooltip>
    </>
  );
};
