"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePrompts } from "@/hooks/use-prompt";
import { cn } from "@/lib/utils";
import { Loader2, PlusCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function PromptSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("mode") ?? "edit";

  const { data: prompts, isLoading, isError, refetch } = usePrompts();

  return (
    <div className="flex h-screen w-80 flex-col border-r bg-background">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h2 className="text-md font-semibold">Prompts</h2>
        <div className="flex gap-1">
          {isError && (
            <Button variant="ghost" size="xsicon" onClick={() => refetch()}>
              <RefreshCw className="size-5" />
              <span className="sr-only">Add new prompt</span>
            </Button>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/prompt?mode=edit" className="flex items-center gap-1">
                <Button variant="ghost" size="xsicon">
                  <PlusCircle className="size-5" />
                  <span className="sr-only">Add new prompt</span>
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add new prompt</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <ScrollArea className="flex-grow">
        <div className="">
          <div key="global" className="mb-6">
            <ul>
              {isLoading && <Loader2 className="mt-6 h-4 w-full animate-spin self-center" />}
              {isError && <p className="mt-6 text-center text-sm text-red-500">Failed to load prompts</p>}
              {prompts?.map((prompt) => {
                const isActive = pathname === `/prompt/${prompt.id}`;
                return (
                  <li key={prompt.id} className="border-b">
                    <Link
                      href={`/prompt/${prompt.id}?mode=${tab}`}
                      className={cn(
                        "block border-l-8 border-transparent p-3 transition-colors duration-200 hover:bg-muted",
                        isActive && "border-primary/70 bg-muted",
                      )}
                    >
                      <div className="mb-1 font-medium">{prompt.name}</div>
                      <div className="text-xs text-muted-foreground">{prompt.description ?? "--"}</div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
