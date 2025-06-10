import { CodeInterpreterStatus } from "./code-interpreter-status";
import { Badge } from "./ui/badge";

type ChatMessageHeaderProps = {
  codeInterpreterEnabled?: boolean;
  sessionId?: string;
  className?: string;
};

/**
 * A component that shows status information at the top of the chat panel
 */
export function ChatMessageHeader({ codeInterpreterEnabled, sessionId, className = "" }: ChatMessageHeaderProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 px-2 py-1 text-xs text-muted-foreground ${className}`}>
      {codeInterpreterEnabled && (
        <CodeInterpreterStatus enabled={true} sessionId={sessionId} />
      )}
    </div>
  );
}