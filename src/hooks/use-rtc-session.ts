"use client";

import { Voice } from "@/components/VoiceSelector";
import { useEffect, useRef, useState } from "react";

export type RtcStatus =
  | "requesting_microphone_access"
  | "fetching_ephemeral_token"
  | "establishing_connection"
  | "connected"
  | "error"
  | "disconnected";

const useWebRTCAudioSession = (voice: string) => {
  const [status, setStatus] = useState<RtcStatus>("disconnected");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const audioIndicatorRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);

  // Add data channel configuration
  const configureDataChannel = (dataChannel: RTCDataChannel) => {
    const sessionUpdate = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
      },
    };

    dataChannel.send(JSON.stringify(sessionUpdate));
  };

  // Add data channel message handler
  const handleDataChannelMessage = async (event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);
      setMsgs((prevMsgs) => [...prevMsgs, msg]);
      return msg;
    } catch (error) {
      console.error("Error handling data channel message:", error);
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  const getEphemeralToken = async () => {
    const response = await fetch("/api/session");
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }
    return data.client_secret.value;
  };

  const setupAudioVisualization = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;

    source.connect(analyzer);

    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateIndicator = () => {
      if (!audioContext) return;

      analyzer.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;

      if (audioIndicatorRef.current) {
        audioIndicatorRef.current.classList.toggle("active", average > 30);
      }

      requestAnimationFrame(updateIndicator);
    };

    updateIndicator();
    audioContextRef.current = audioContext;
  };

  const startSession = async () => {
    try {
      setStatus("requesting_microphone_access");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setupAudioVisualization(stream);

      setStatus("fetching_ephemeral_token");
      const ephemeralToken = await getEphemeralToken();

      setStatus("establishing_connection");

      const pc = new RTCPeerConnection();
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      pc.ontrack = (e) => (audioEl.srcObject = e.streams[0]);

      // Add data channel
      const dataChannel = pc.createDataChannel("response");
      dataChannelRef.current = dataChannel;

      dataChannel.onopen = () => {
        configureDataChannel(dataChannel);
      };

      dataChannel.onmessage = handleDataChannelMessage;

      pc.addTrack(stream.getTracks()[0]);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const response = await fetch(`${baseUrl}?model=${model}&voice=${voice}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralToken}`,
          "Content-Type": "application/sdp",
        },
      });

      await pc.setRemoteDescription({
        type: "answer",
        sdp: await response.text(),
      });

      peerConnectionRef.current = pc;
      setIsSessionActive(true);
      setStatus("connected");
    } catch (err) {
      console.error(err);
      setStatus("error");
      stopSession();
    }
  };

  const stopSession = () => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (audioIndicatorRef.current) {
      audioIndicatorRef.current.classList.remove("active");
    }

    setIsSessionActive(false);
    setStatus("disconnected");
    setMsgs([]);
  };

  const handleStartStopClick = () => {
    if (isSessionActive) {
      stopSession();
    } else {
      startSession().catch((err) => {
        setStatus("error");
      });
    }
  };

  const setVoice = (voice: Voice) => {
    const sessionUpdate = {
      type: "session.update",
      session: {
        voice,
      },
    };

    dataChannelRef.current?.send(JSON.stringify(sessionUpdate));
  };

  return {
    status,
    isSessionActive,
    audioIndicatorRef,
    startSession,
    stopSession,
    handleStartStopClick,
    msgs,
    setVoice,
  };
};

export default useWebRTCAudioSession;
