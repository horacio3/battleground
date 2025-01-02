"use client";

import ListeningAnimation from "@/components/listening-animation";
import VoiceSelector, { Voice } from "@/components/VoiceSelector";
import useWebRTCAudioSession from "@/hooks/use-rtc-session";
import { useState } from "react";

export default function Realtime() {
  const [voice, setVoice] = useState<Voice>("alloy");

  const { isSessionActive, handleStartStopClick, status } = useWebRTCAudioSession(voice);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-12">
      <h1 className="text-xl font-light tracking-wide text-gray-400">Speak to OpenAI real-time API</h1>
      <ListeningAnimation isListening={isSessionActive} status={status} onClick={handleStartStopClick} />
      <VoiceSelector disabled={isSessionActive} selectedVoice={voice} onVoiceChange={setVoice} />
    </div>
  );
}
