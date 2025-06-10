import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Code } from "lucide-react";

/**
 * A component that shows information about code interpreter
 */
export function CodeInterpreterInfo() {
  return (
    <Alert className="mb-4 bg-blue-50/50 dark:bg-blue-900/10">
      <Code className="h-4 w-4 text-blue-500" />
      <AlertTitle>Code Interpreter Enabled</AlertTitle>
      <AlertDescription>
        You can now run Python code in this chat. Try asking the model to create charts, analyze data, or write functions.
      </AlertDescription>
    </Alert>
  );
}