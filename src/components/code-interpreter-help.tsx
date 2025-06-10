import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { HelpCircle } from "lucide-react";

/**
 * A component that shows help information for the code interpreter
 */
export function CodeInterpreterHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Code Interpreter</DialogTitle>
          <DialogDescription>
            Run code directly in your chat session
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <h4 className="font-medium">What can Code Interpreter do?</h4>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              <li>Execute Python code</li>
              <li>Generate and display charts and visualizations</li>
              <li>Process and analyze data</li>
              <li>Maintain state between executions</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium">How to use it</h4>
            <ol className="list-decimal pl-5 text-sm text-muted-foreground">
              <li>Enable Code Interpreter using the toggle</li>
              <li>Ask the model to write or run code</li>
              <li>View the results directly in the chat</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-medium">Example prompts</h4>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              <li>"Plot a sine wave using matplotlib"</li>
              <li>"Create a simple calculator function"</li>
              <li>"Generate a random dataset and analyze it"</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="secondary">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}