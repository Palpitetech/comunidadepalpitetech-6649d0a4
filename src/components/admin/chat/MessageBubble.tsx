import React from "react";
import { Message } from "@/hooks/useChatMessages";
import { format, isValid } from "date-fns";

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isOutbound = message.direction === "outbound";

  return (
    <div className={`flex w-full mb-1 ${isOutbound ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] md:max-w-[70%] px-3 py-1.5 rounded-lg shadow-sm relative ${
          isOutbound
            ? "bg-[#dcf8c6] dark:bg-primary text-foreground rounded-tr-none"
            : "bg-background text-foreground rounded-tl-none border border-border"
        }`}
      >
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
          {message.content}
        </p>
        <div className="flex justify-end items-center mt-1 space-x-1">
          <span className="text-[10px] text-muted-foreground/80 leading-none">
            {message.received_at && isValid(new Date(message.received_at)) 
              ? format(new Date(message.received_at), "HH:mm") 
              : ""}
          </span>
          {isOutbound && (
            <span className="text-[10px] text-primary-foreground/60 leading-none">
              {/* Checkmark placeholder */}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
