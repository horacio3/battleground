import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Code, LineChart, Table2 } from "lucide-react";

type ExampleProps = {
  onSelect: (example: string) => void;
};

/**
 * A component that shows example prompts for the code interpreter
 */
export function CodeInterpreterExamples({ onSelect }: ExampleProps) {
  const examples = [
    {
      title: "Data Visualization",
      description: "Create charts and graphs",
      icon: <LineChart className="h-5 w-5" />,
      prompt: "Generate a random dataset and create a scatter plot with a trend line using matplotlib."
    },
    {
      title: "Data Analysis",
      description: "Process and analyze data",
      icon: <Table2 className="h-5 w-5" />,
      prompt: "Create a pandas DataFrame with sample sales data and calculate summary statistics."
    },
    {
      title: "Custom Functions",
      description: "Write reusable code",
      icon: <Code className="h-5 w-5" />,
      prompt: "Write a Python function that calculates the Fibonacci sequence up to n terms."
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {examples.map((example, index) => (
        <Card key={index} className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="mb-2 rounded-md bg-primary/10 p-2 w-fit">
              {example.icon}
            </div>
            <CardTitle className="text-base">{example.title}</CardTitle>
            <CardDescription>{example.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow text-sm text-muted-foreground">
            <p className="line-clamp-3">{example.prompt}</p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onSelect(example.prompt)}
            >
              Try this
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}