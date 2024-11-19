import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider } from "@clerk/nextjs";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import QueryProvider from "./providers";
import { ThemeProvider } from "./theme-provider";

import "./icons.css";

export const metadata: Metadata = {
  title: "Bedrock Playground",
  description: "Test and compare Amazon Bedrock models",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <QueryProvider>
            <ThemeProvider attribute="class" defaultTheme="light">
              <TooltipProvider delayDuration={0}>
                <div className="flex h-screen w-screen flex-row overflow-hidden">{children}</div>
                <Toaster />
              </TooltipProvider>
            </ThemeProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
