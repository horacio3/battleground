"use client";

import { AudioLines, Bot, Github, ImageIcon, NotebookPenIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SettingsButton } from "./settings-button";
import { ThemeToggle } from "./theme-toggle";

export function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isPromptPath = pathname.startsWith("/prompt");
  const isComparePath = pathname.startsWith("/prompt/compare");

  return (
    <div className="grid h-screen w-full pl-[56px]">
      <aside className="inset-y fixed left-0 z-20 flex h-full flex-col border-r bg-background">
        <div className="flex h-14 w-14 items-center justify-center border-b p-2">
          <img src="/battle.png" alt="Bedrock Battleground" className="size-7" />
        </div>
        <nav className="grid gap-1 p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-lg", pathname === "/chat" ? "bg-muted" : "")}
                aria-label="Chat Comparison"
                onClick={() => router.push("/chat")}
              >
                <Bot className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5} className="invert">
              Chat
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-lg", pathname === "/image" ? "bg-muted" : "")}
                aria-label="Image Comparison"
                onClick={() => router.push("/image")}
              >
                <ImageIcon className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5} className="invert">
              Image
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-lg", isPromptPath && !isComparePath ? "bg-muted" : "")}
                aria-label="Prompt Editor"
                onClick={() => router.push("/prompt")}
              >
                <NotebookPenIcon className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5} className="invert">
              Prompt Editor
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-lg", pathname === "/realtime" ? "bg-muted" : "")}
                aria-label="Realtime"
                onClick={() => router.push("/realtime")}
              >
                <AudioLines className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5} className="invert">
              Realtime
            </TooltipContent>
          </Tooltip>
          <SettingsButton />
        </nav>
        <nav className="mb-2 mt-auto flex flex-col items-center gap-4 p-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="https://github.com/caylent/battleground" target="_blank">
              <Github className="size-5" />
            </Link>
          </Button>
          <ThemeToggle />
          <UserButton />
        </nav>
      </aside>
      <div className="flex flex-col overflow-hidden overscroll-contain scroll-smooth">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-1 border-b bg-background px-4">
          <h1 className="text-xl font-semibold">Bedrock Battleground</h1>
        </header>
        {children}
      </div>
    </div>
  );
}
