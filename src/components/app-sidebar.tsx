"use client";

import { Bot, Frame, Image, Map, MessageCircle, PieChart, Settings2, Swords } from "lucide-react";
import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Chat",
      url: "/chat",
      icon: MessageCircle,
      isActive: true,
      items: [
        {
          title: "Persist",
          url: "/chat",
        },
        {
          title: "Compare",
          url: "/chat/compare",
        },
      ],
    },
    {
      title: "Prompt",
      url: "/prompt/compare",
      icon: Bot,
      items: [
        {
          title: "Editor",
          url: "/prompt/editor",
        },
        {
          title: "Compare",
          url: "/prompt/compare",
        },
      ],
    },
    {
      title: "Image",
      url: "/image/compare",
      icon: Image,
      items: [
        {
          title: "Editor",
          url: "/image/editor",
        },
        {
          title: "Compare",
          url: "/image/compare",
        },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/settings/general",
        },
        {
          title: "Guardrails",
          url: "/settings/guard",
        },
        {
          title: "Knowledge Bases",
          url: "/settings/knowledge-bases",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <Swords className="size-5 text-green-400" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Battleground</span>
            <span className="truncate text-xs">via Amazon Bedrock</span>
          </div>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
