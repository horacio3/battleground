"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePrompt } from "@/hooks/use-prompt";
import { getPromptVariables } from "@/lib/get-prompt-variables";
import { TextModel } from "@/lib/model/model.type";
import { textModels } from "@/lib/model/models";
import { ChatParams } from "@/stores/chat-store";
import { ResponseMetrics } from "@/types/response-metrics.type";
import { useChat } from "@ai-sdk/react";
import { BetweenHorizonalEnd, Copy, Loader2, MoreVerticalIcon, Play, PlusIcon, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { ChatConfig } from "./chat-config";
import { MemoizedMarkdown } from "./markdown";
import { MetricsDisplay } from "./metrics-display";
import { ModelSelect } from "./model-select";
import { ScrollArea } from "./ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type Row = {
  id: string;
  prompt: string;
  variables: Record<string, string>;
  model: TextModel;
  output: string;
  trigger: boolean;
};

export function PromptEvaluator({ promptId }: { promptId?: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const { data: prompt, isLoading } = usePrompt({ id: promptId });

  const promptText = prompt?.variants?.[0]?.templateConfiguration?.text?.text ?? "";

  const promptVariables = getPromptVariables(promptText);

  useEffect(() => {
    if (!prompt) return;
    setRows([
      {
        id: nanoid(),
        prompt: promptText,
        variables: promptVariables,
        model: textModels[0],
        output: "",
        trigger: false,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  const addRow = () => {
    const newRow: Row = {
      id: nanoid(),
      prompt: promptText,
      variables: promptVariables,
      model: textModels[0],
      output: "",
      trigger: false,
    };
    setRows([...rows, newRow]);
  };

  const runAll = () => {
    setRows((rows) => rows.map((row) => ({ ...row, trigger: true })));
  };

  return (
    <div className="flex h-full w-full flex-col space-y-4 p-4">
      <div className="flex items-center gap-2">
        <h1 className="font-bold">Evaluate:</h1>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="sm">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span>{prompt?.name}</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start" asChild className="p-4">
            <div className="max-h-80 min-w-[400px] max-w-[600px] overflow-y-auto rounded-md border bg-muted p-2 text-sm">
              <pre className="whitespace-pre-wrap">{promptText}</pre>
            </div>
          </TooltipContent>
        </Tooltip>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={addRow} variant="ghost" size="sm">
            <PlusIcon className="mr-2 h-4 w-4" /> Add Row
          </Button>
          <Button onClick={runAll} variant="default" size="sm">
            <Play className="mr-2 h-4 w-4" /> Run All
          </Button>
        </div>
      </div>

      <ScrollArea className="h-full w-full">
        <div className="rounded-md border">
          <Table className="overflow-x-auto">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] border-r px-0 text-center align-middle">#</TableHead>
                {Object.keys(promptVariables).map((name) => (
                  <TableHead key={name} className="border-r px-2">
                    <span className="rounded-md bg-muted p-1.5 font-mono text-xs font-bold text-green-600 dark:text-green-500">{`{{${name}}}`}</span>
                  </TableHead>
                ))}
                <TableHead className="border-r">Model</TableHead>
                <TableHead className="border-r">Output</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <PromptRow key={row.id} row={row} idx={idx} setRows={setRows} />
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
}

const PromptRow = ({ row, idx, setRows }: { row: Row; idx: number; setRows: Dispatch<SetStateAction<Row[]>> }) => {
  const [updateData, setUpdateData] = useState(false);
  const [metrics, setMetrics] = useState<ResponseMetrics>();

  const updateVariable = (rowId: string, varName: string, value: string) => {
    setRows((rows) =>
      rows.map((row) => (row.id === rowId ? { ...row, variables: { ...row.variables, [varName]: value } } : row)),
    );
  };

  const updateModel = (rowId: string, model: TextModel) => {
    setRows((rows) => rows.map((row) => (row.id === rowId ? { ...row, model } : row)));
  };

  const updateModelConfig = (rowId: string, config: ChatParams) => {
    setRows((rows) =>
      rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              model: {
                ...row.model,
                config: {
                  systemPrompt: config.systemPrompt ?? row.model.config?.systemPrompt,
                  maxTokens: {
                    ...row.model.config?.maxTokens,
                    value: config.maxTokens ?? row.model.config?.maxTokens.value,
                  },
                  temperature: {
                    ...row.model.config?.temperature,
                    value: config.temperature ?? row.model.config?.temperature.value,
                  },
                  topP: {
                    ...row.model.config?.topP,
                    value: config.topP ?? row.model.config?.topP.value,
                  },
                },
              },
            }
          : row,
      ),
    );
  };

  const synchronizeSystemPrompt = (rowId: string) => {
    setRows((rows) =>
      rows.map((r) => ({
        ...r,
        model: { ...r.model, config: { ...r.model.config, systemPrompt: row.model.config?.systemPrompt } },
      })),
    );
  };

  const duplicateRow = (rowId: string) => {
    setRows((rows) => {
      const rowToDuplicate = rows.find((row) => row.id === rowId);
      if (rowToDuplicate) {
        const newRow = { ...rowToDuplicate, output: "", id: nanoid() };
        return [...rows, newRow];
      }
      return rows;
    });
  };

  const insertRowBelow = (rowId: string) => {
    setRows((rows) => {
      const index = rows.findIndex((row) => row.id === rowId);
      const newRow: Row = {
        id: nanoid(),
        prompt: row.prompt,
        variables: row.variables,
        model: textModels[0],
        output: "",
        trigger: false,
      };
      return [...rows.slice(0, index + 1), newRow, ...rows.slice(index + 1)];
    });
  };

  const deleteRow = (rowId: string) => {
    setRows((rows) => rows.filter((row) => row.id !== rowId));
  };

  const runPrompt = (rowId: string) => {
    setRows((rows) => rows.map((row) => (row.id === rowId ? { ...row, trigger: true } : row)));
  };

  const { messages, append, setMessages, isLoading, data } = useChat({
    id: row.id,
    body: {
      modelId: row?.model.id,
      config: row?.model.config,
    },
    streamProtocol: "data",
    sendExtraMessageFields: true,
    onFinish() {
      setUpdateData(true);
    },
    onError(error) {
      const { message } = JSON.parse(error.message);
      toast.error(`${row?.model.id}: ${message}`);
    },
  });

  // update assistant messages with data if available
  useEffect(() => {
    if (!updateData) return;
    const lastData = data?.at(-1);
    if (!lastData) return;
    setMetrics(lastData as ResponseMetrics);
    setUpdateData(false);
  }, [data, updateData]);

  useEffect(() => {
    if (row.trigger && !isLoading) {
      let filledPrompt = row.prompt;
      Object.entries(row.variables).forEach(([key, value]) => {
        filledPrompt = filledPrompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
      });
      setMessages([]);
      setMetrics(undefined);
      append({
        role: "user",
        content: filledPrompt,
      });
      setRows((rows) => rows.map((r) => (r.id === row.id ? { ...r, trigger: false } : r)));
    }
  }, [row.trigger, row.prompt, isLoading, setMessages, append, row, setRows]);

  return (
    <TableRow key={row.id}>
      <TableCell className="border-r text-center align-top">
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : idx + 1}
      </TableCell>
      {Object.entries(row.variables).map(([varName, value]) => (
        <TableCell
          key={varName}
          className="w-[300px] min-w-[200px] border-r p-2 align-top"
          onClick={(e) => {
            const textarea = e.currentTarget.querySelector("textarea");
            if (textarea) textarea.focus();
          }}
        >
          <TextareaAutosize
            value={value}
            rows={1}
            minRows={1}
            maxRows={4}
            onChange={(e) => updateVariable(row.id, varName, e.target.value)}
            className="w-full resize-none rounded-md bg-transparent p-2 outline-none"
          />
        </TableCell>
      ))}
      <TableCell className="w-[300px] border-r p-3 align-top">
        <div className="flex items-center space-x-2">
          <ModelSelect
            models={textModels}
            selectedModelId={row.model.id}
            onChange={(modelId) => updateModel(row.id, textModels.find((m) => m.id === modelId) ?? textModels[0])}
          />
          <ChatConfig
            model={row.model}
            onConfigChange={(config) => updateModelConfig(row.id, config)}
            onSynchronizeSystemPrompt={() => synchronizeSystemPrompt(row.id)}
          />
        </div>
      </TableCell>
      <TableCell className="min-w-[400px] space-y-4 border-r p-2 text-xs">
        <ScrollArea type="auto" className="flex max-h-28 w-full flex-col">
          <MemoizedMarkdown response={messages.at(1)?.content ?? ""} className="text-xs" />
        </ScrollArea>
        <MetricsDisplay {...metrics} />
      </TableCell>
      <TableCell className="p-2 text-center align-top">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVerticalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-green-500" onClick={() => runPrompt(row.id)}>
              <Play className="mr-2 size-4" />
              Run Prompt
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => duplicateRow(row.id)}>
              <Copy className="mr-2 size-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertRowBelow(row.id)}>
              <BetweenHorizonalEnd className="mr-2 size-4" />
              Insert Below
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500" onClick={() => deleteRow(row.id)}>
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};
