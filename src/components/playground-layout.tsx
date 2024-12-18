"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "./ui/breadcrumb";
import { Separator } from "./ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";

export function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const breadcrumbs = pathname
    .split("/")
    .filter(Boolean)
    .map((crumb) => crumb.charAt(0).toUpperCase() + crumb.slice(1).toLowerCase());

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 border-b bg-background p-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((breadcrumb, index) => (
                <>
                  <BreadcrumbItem key={index}>
                    <BreadcrumbLink href="#">{breadcrumb}</BreadcrumbLink>
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator className="hidden md:block" />}
                </>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
