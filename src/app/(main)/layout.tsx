import { PlaygroundLayout } from "@/components/playground-layout";
import { Suspense } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PlaygroundLayout>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </PlaygroundLayout>
  );
}
