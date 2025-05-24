import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { ReactNode, useEffect, useRef } from "react";

type ScrollButtonAlignment = "left" | "center" | "right";

interface ScrollButtonProps {
  onClick: () => void;
  alignment?: ScrollButtonAlignment;
  className?: string;
}

export function ScrollButton({ onClick, alignment = "right", className }: ScrollButtonProps) {
  const alignmentClasses = {
    left: "left-4",
    center: "left-1/2 -translate-x-1/2",
    right: "right-4",
  };

  return (
    <Button
      variant="secondary"
      size="icon"
      className={cn(
        "absolute bottom-4 rounded-full shadow-lg hover:bg-secondary",
        alignmentClasses[alignment],
        className,
      )}
      onClick={onClick}
    >
      <ChevronDown className="h-4 w-4" />
    </Button>
  );
}

interface ChatMessageAreaProps {
  children: ReactNode;
  className?: string;
  scrollButtonAlignment?: ScrollButtonAlignment;
  autoScrollToBottom?: boolean;
}

export function ChatMessageArea({ 
  children, 
  className, 
  scrollButtonAlignment = "right",
  autoScrollToBottom = true
}: ChatMessageAreaProps) {
  const [containerRef, showScrollButton, scrollToBottom] = useScrollToBottom<HTMLDivElement>();
  const initialScrollDone = useRef(false);
  
  // Auto-scroll to bottom only on mount or when switching conversations
  useEffect(() => {
    if (autoScrollToBottom && !initialScrollDone.current) {
      const timer = setTimeout(() => {
        scrollToBottom();
        initialScrollDone.current = true;
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [autoScrollToBottom, scrollToBottom]);

  // Reset the initialScrollDone ref when the component unmounts
  // This ensures auto-scroll works when switching between conversations
  useEffect(() => {
    return () => {
      initialScrollDone.current = false;
    };
  }, []);

  return (
    <ScrollArea className="relative flex-1">
      <div ref={containerRef}>
        <div className={cn(className, "min-h-0")}>{children}</div>
      </div>
      {showScrollButton && (
        <ScrollButton
          onClick={scrollToBottom}
          alignment={scrollButtonAlignment}
          className="absolute bottom-4 rounded-full shadow-lg hover:bg-secondary"
        />
      )}
    </ScrollArea>
  );
}

ChatMessageArea.displayName = "ChatMessageArea";