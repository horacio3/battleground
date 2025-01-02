"use client";;
import { use } from "react";

import { PromptEditorComponent } from "@/components/prompt-editor";
import { PromptEvaluator } from "@/components/prompt-evaluator";
import { PromptSidebar } from "@/components/prompt-sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";

export default function PromptEditor(props: { params: Promise<{ slug?: string[] }> }) {
  const params = use(props.params);
  const id = params.slug?.[0];
  const router = useRouter();
  const searchParams = useSearchParams();

  const tab = searchParams.get("mode") ?? "edit";

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex w-full flex-1 flex-row overflow-hidden">
        <PromptSidebar />
        <div className="flex h-full flex-1 flex-col overflow-hidden ">
          <Tabs value={tab} className="flex h-full flex-col">
            <div className="flex flex-row justify-center gap-1 border-b py-2">
              <div className="space-x-1 rounded-full bg-muted p-1">
                <Button
                  className="h-6 w-24 rounded-full"
                  variant={tab === "edit" ? "default" : "link"}
                  onClick={() => router.replace(`/prompt/${id}?mode=edit`)}
                >
                  Edit
                </Button>
                <Button
                  disabled={!id}
                  className="h-6 w-24 rounded-full"
                  variant={tab === "evaluate" ? "default" : "ghost"}
                  onClick={() => router.replace(`/prompt/${id}?mode=evaluate`)}
                >
                  Evaluate
                </Button>
              </div>
            </div>
            <div className="flex flex-1 flex-row overflow-hidden">
              <TabsContent value="edit" className="mt-0 h-full flex-1">
                <PromptEditorComponent promptId={id} />
              </TabsContent>
              <TabsContent value="evaluate" className="mt-0 h-full flex-1">
                <PromptEvaluator promptId={id} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
