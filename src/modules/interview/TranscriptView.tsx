// components/TranscriptView.tsx
"use client";
import React, { useRef, useEffect } from "react";
import { TranscriptMessage } from "./types"; // Assuming types.ts is in the same folder or accessible

export const TranscriptView: React.FC<{
  transcript: TranscriptMessage[];
  isThinking: boolean;
}> = ({ transcript, isThinking }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, isThinking]);

  return (
    <div ref={scrollRef} className="flex-grow p-1 space-y-4 overflow-y-auto">
      {transcript.length === 0 && !isThinking && (
        <div className="text-center text-gray-400 pt-16">
          <p>Your conversation will appear here.</p>
        </div>
      )}
      {transcript.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${
            msg.speaker === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`px-4 py-2 rounded-2xl max-w-sm shadow-sm ${
              msg.speaker === "user"
                ? "bg-blue-600 text-white rounded-br-none"
                : "bg-gray-700 text-gray-100 rounded-bl-none"
            }`}
          >
            <p className="text-sm">{msg.text}</p>
          </div>
        </div>
      ))}
      {isThinking && (
        <div className="flex justify-start">
          <div className="px-4 py-2 rounded-2xl max-w-sm shadow-sm bg-gray-700 text-gray-100 rounded-bl-none">
            <div className="flex items-center justify-center space-x-1 h-5">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
