import { convertAiMessagesToCoreMessages } from "@/lib/convert-messages-to-core-messages";
import { getRequestCost } from "@/lib/model/get-request-cost";
import { TextModelConfig } from "@/lib/model/model-configs";
import { TextModelId } from "@/lib/model/model.type";
import { textModels } from "@/lib/model/models";
import { externalRateLimiter, internalRateLimiter } from "@/lib/rate-limiter";
import { ResponseMetrics } from "@/types/response-metrics.type";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { createOpenAI } from "@ai-sdk/openai";
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime"; // Changed import
import { auth } from "@clerk/nextjs/server";
import { createDataStreamResponse, Message, streamText } from "ai";
import { NextRequest } from "next/server";

const internalRateLimitDomain = process.env.INTERNAL_RATE_LIMIT_DOMAIN;

// Initialize Bedrock Agent Runtime client
const agentClient = new BedrockAgentRuntimeClient({
  region: "us-east-1",
});

export async function POST(req: NextRequest) {
  const { sessionClaims } = await auth();

  if (!sessionClaims?.email) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  // Rate limiting code...
  if (internalRateLimitDomain && sessionClaims?.email?.endsWith(internalRateLimitDomain)) {
    const { success } = await internalRateLimiter.limit(sessionClaims.email);
    if (!success) {
      return new Response(JSON.stringify({ message: "Too many requests" }), { status: 429 });
    }
  } else {
    const { success } = await externalRateLimiter.limit(sessionClaims.email);
    if (!success) {
      return new Response(JSON.stringify({ message: "Too many requests" }), { status: 429 });
    }
  }

  const { modelId, messages, config, codeInterpreter } = (await req.json()) as {
    modelId: TextModelId;
    messages: Message[];
    config?: TextModelConfig;
    codeInterpreter?: {
      enabled: boolean;
      actionGroupName: string;
    };
  };

  const modelInfo = textModels.find((m) => m.id === modelId);

  try {
    // If code interpreter is enabled, use DIRECT AWS SDK
    if (codeInterpreter?.enabled) {
      console.log("[DEBUG] Using direct Bedrock Agent SDK for code interpreter");

      // Get the last user message as the prompt
      const lastMessage = messages[messages.length - 1];
      const inputText = lastMessage?.content || "";

      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      return createDataStreamResponse({
        execute: async (dataStream) => {
          try {
            const start = Date.now();
            let firstTokenTime: number = NaN;

            const command = new InvokeAgentCommand({
              agentId: process.env.BEDROCK_AGENT_ID || "FRVW3VGKLH",
              agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID || "TSTALIASID",
              sessionId,
              inputText,
            });

            console.log("[DEBUG] Invoking Bedrock Agent:", {
              agentId: process.env.BEDROCK_AGENT_ID || "FRVW3VGKLH",
              agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID || "TSTALIASID",
              sessionId,
              inputText: inputText.substring(0, 100) + "...",
            });

            const response = await agentClient.send(command);

            let textContent = "";
            let totalInputTokens = 0;
            let totalOutputTokens = 0;

            if (response.completion) {
              for await (const chunk of response.completion) {
                // Handle text content
                if (chunk.chunk?.bytes) {
                  if (!firstTokenTime) {
                    firstTokenTime = Date.now() - start;
                  }

                  const decoded = new TextDecoder().decode(chunk.chunk.bytes);
                  textContent += decoded;

                  // Stream the text content
                  dataStream.writeData(decoded);
                }

                // Handle files using our proven method
                function deepSearch(obj: any) {
                  if (typeof obj !== "object" || obj === null) return;

                  if (obj.name && obj.type && obj.bytes && typeof obj.name === "string") {
                    console.log(`[DEBUG] Found file: ${obj.name} (${obj.type})`);

                    // Convert bytes object to Uint8Array
                    const byteKeys = Object.keys(obj.bytes)
                      .map(Number)
                      .sort((a, b) => a - b);
                    const byteArray = new Uint8Array(byteKeys.map((key) => obj.bytes[key]));

                    console.log(`[DEBUG] File size: ${byteArray.length} bytes`);

                    // Convert to base64 for frontend
                    const base64 = Buffer.from(byteArray).toString("base64");

                    dataStream.writeMessageAnnotation({
                      type: "file",
                      name: obj.name,
                      mimeType: obj.type,
                      data: base64,
                    });
                  }

                  // Recursively search
                  for (const value of Object.values(obj)) {
                    if (typeof value === "object" && value !== null) {
                      deepSearch(value);
                    }
                  }
                }

                deepSearch(chunk);

                // Handle usage/token info if available
                if (chunk.trace?.usage) {
                  totalInputTokens += chunk.trace.usage.inputTokens || 0;
                  totalOutputTokens += chunk.trace.usage.outputTokens || 0;
                }
              }
            }

            console.log("[DEBUG] Bedrock Agent response completed");
            console.log("[DEBUG] Text length:", textContent.length);

            // Send final metrics
            dataStream.writeMessageAnnotation({
              firstTokenTime: firstTokenTime || Date.now() - start,
              responseTime: Date.now() - start,
              inputTokens: totalInputTokens || Math.ceil(inputText.length / 4), // Rough estimate
              outputTokens: totalOutputTokens || Math.ceil(textContent.length / 4), // Rough estimate
              cost: getRequestCost({
                modelId,
                inputTokens: totalInputTokens || Math.ceil(inputText.length / 4),
                outputTokens: totalOutputTokens || Math.ceil(textContent.length / 4),
              }),
            } satisfies ResponseMetrics);
          } catch (err) {
            console.error("[DEBUG] Bedrock Agent error:", err);
            throw err;
          }
        },
        onError: (err) => {
          console.error("ERROR", JSON.stringify(err, null, 2));
          return "error";
        },
      });
    } else {
      // Regular chat without code interpreter - keep existing logic
      const model =
        modelInfo?.provider === "Nvidia"
          ? createOpenAI({
              baseURL: "https://integrate.api.nvidia.com/v1",
              apiKey: process.env.NVIDIA_NIM_API_KEY ?? "",
            })(modelId)
          : modelInfo?.provider === "OpenAI"
            ? createOpenAI({
                compatibility: "strict",
                apiKey: process.env.OPENAI_API_KEY ?? "",
              })(modelId)
            : createAmazonBedrock({
                region: modelInfo?.region ?? "us-east-1",
              })(modelId);

      let firstTokenTime: number = NaN;
      const start = Date.now();

      const bedrockOptions: Record<string, any> = {};
      if (config?.reasoning?.enabled) {
        bedrockOptions.reasoning_config = { type: "enabled", budget_tokens: config.reasoning.budgetTokens.value };
      }

      return createDataStreamResponse({
        execute: (dataStream) => {
          const result = streamText({
            model,
            system: modelInfo?.systemPromptSupport && !!config?.systemPrompt ? config.systemPrompt : undefined,
            messages: convertAiMessagesToCoreMessages(messages),
            maxTokens: config?.maxTokens.value,
            temperature: config?.temperature.value,
            topP: config?.topP.value,
            headers: {
              "user-agent": "node",
            },
            providerOptions: {
              bedrock: bedrockOptions,
            },
            onChunk: () => {
              if (!firstTokenTime) {
                firstTokenTime = Date.now() - start;
              }
            },
            onFinish: (e) => {
              const inputTokens = e.usage.promptTokens ?? NaN;
              const outputTokens = e.usage.completionTokens ?? NaN;
              dataStream.writeMessageAnnotation({
                firstTokenTime,
                responseTime: Date.now() - start,
                inputTokens,
                outputTokens,
                cost: getRequestCost({ modelId, inputTokens, outputTokens }),
              } satisfies ResponseMetrics);
            },
          });

          result.mergeIntoDataStream(dataStream, { sendReasoning: true });
        },
        onError: (err) => {
          console.error("ERROR", JSON.stringify(err, null, 2));
          return "error";
        },
      });
    }
  } catch (err: any) {
    console.error("ERROR", err);
    return Response.json({ message: err.message }, { status: err.httpStatusCode ?? 500 });
  }
}
