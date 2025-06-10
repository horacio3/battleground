import { Badge } from "./ui/badge";
import { Code } from "lucide-react";

type CodeInterpreterBadgeProps = {
  className?: string;
};

/**
 * A simple badge component to indicate code interpreter is enabled
 */
export function CodeInterpreterBadge({ className = "" }: CodeInterpreterBadgeProps) {
  return (
    <Badge variant="outline" className={`h-5 bg-blue-200 font-light dark:bg-blue-800 flex items-center gap-1 ${className}`}>
      <Code className="h-3 w-3" />
      <span>Code</span>
    </Badge>
  );
}