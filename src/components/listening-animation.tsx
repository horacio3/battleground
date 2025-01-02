"use client";

import { RtcStatus } from "@/hooks/use-rtc-session";
import { motion } from "framer-motion";

interface ListeningAnimationProps {
  isListening: boolean;
  status: RtcStatus;
  onClick: () => void;
}

export default function ListeningAnimation({ isListening, status, onClick }: ListeningAnimationProps) {
  const buttonText = status === "connected" ? "Stop" : status === "disconnected" ? "Start" : "Connecting...";

  return (
    <motion.button
      className="relative h-48 w-48 cursor-pointer border-none bg-transparent focus:outline-none"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute inset-0 rounded-full bg-green-500 opacity-75"
        animate={{
          scale: isListening ? [1, 1.2, 1] : 1,
        }}
        transition={{
          duration: 1.5,
          repeat: isListening ? Infinity : 0,
          repeatType: "loop",
        }}
      />
      <motion.div
        className="absolute inset-0 flex items-center justify-center rounded-full bg-green-300"
        animate={{
          scale: isListening ? [1, 1.1, 1] : 1,
        }}
        transition={{
          duration: 1.5,
          repeat: isListening ? Infinity : 0,
          repeatType: "loop",
          delay: 0.2,
        }}
      >
        <span className="font-semibold text-gray-800">{buttonText}</span>
      </motion.div>
    </motion.button>
  );
}
