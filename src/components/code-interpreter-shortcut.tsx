import { Button } from "./ui/button";
import { Code } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { TooltipArrow } from "@radix-ui/react-tooltip";

type CodeInterpreterShortcutProps = {
  onClick: (code: string) => void;
};

/**
 * A component that provides quick access to common code interpreter commands
 */
export function CodeInterpreterShortcut({ onClick }: CodeInterpreterShortcutProps) {
  const shortcuts = [
    {
      name: "Plot",
      code: "import matplotlib.pyplot as plt\nimport numpy as np\n\n# Generate data\nx = np.linspace(0, 10, 100)\ny = np.sin(x)\n\n# Create plot\nplt.figure(figsize=(8, 4))\nplt.plot(x, y)\nplt.title('Sine Wave')\nplt.xlabel('x')\nplt.ylabel('sin(x)')\nplt.grid(True)\nplt.show()",
      icon: <Code className="h-4 w-4" />
    },
    {
      name: "DataFrame",
      code: "import pandas as pd\n\n# Create a sample DataFrame\ndata = {\n    'Name': ['Alice', 'Bob', 'Charlie', 'David'],\n    'Age': [25, 30, 35, 40],\n    'City': ['New York', 'San Francisco', 'Los Angeles', 'Chicago'],\n    'Salary': [70000, 80000, 90000, 100000]\n}\n\ndf = pd.DataFrame(data)\ndf",
      icon: <Code className="h-4 w-4" />
    }
  ];

  return (
    <div className="flex gap-2">
      {shortcuts.map((shortcut) => (
        <Tooltip key={shortcut.name}>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 px-2 text-xs"
              onClick={() => onClick(shortcut.code)}
            >
              {shortcut.icon}
              <span className="ml-1">{shortcut.name}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Insert {shortcut.name} code example
            <TooltipArrow />
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}