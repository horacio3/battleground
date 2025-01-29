"use client";

import { AudioLines, Edit, GithubIcon, Image, MessageCircle, Video } from "lucide-react";
import * as React from "react";

import { NavLink, NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { NavUser } from "./nav-user";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";

const navItems: NavLink[] = [
  {
    title: "Chat",
    url: "/chat",
    icon: MessageCircle,
  },
  {
    title: "Prompt",
    url: "/prompt/new",
    icon: Edit,
  },
  {
    title: "Image",
    url: "/image",
    icon: Image,
  },
  {
    title: "Video",
    url: "/video",
    icon: Video,
  },
  {
    title: "Realtime",
    url: "/realtime",
    icon: AudioLines,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuButton size="lg" className="data-[state=open]:bg-foreground data-[state=open]:text-background">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gray-800 text-lime-500">
            <img src="/battle.png" className="size-5" />
          </div>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuButton asChild>
          <Button variant="ghost" size="icon">
            <Link target="_blank" href="https://github.com/caylent/battleground">
              <GithubIcon className="size-4" />
            </Link>
          </Button>
        </SidebarMenuButton>
        <SidebarMenuButton asChild>
          <ThemeToggle />
        </SidebarMenuButton>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
