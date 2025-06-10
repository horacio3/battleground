import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.message || body.prompt; // Support both message and prompt
    const sessionId = body.sessionId;
    const history = body.history || [];

    console.log("[DEBUG] Request body:", body);
    console.log("[DEBUG] Extracted prompt:", prompt);
    console.log("[DEBUG] Session ID:", sessionId);
    console.log("[DEBUG] History length:", history.length);
    console.log("[DEBUG] AWS Region:", process.env.AWS_REGION);
    console.log("[DEBUG] Agent ID:", process.env.BEDROCK_AGENT_ID);
    console.log("[DEBUG] Agent Alias ID:", process.env.BEDROCK_AGENT_ALIAS_ID);

    // Check if prompt is empty
    if (!prompt || prompt.trim() === "") {
      return new Response(JSON.stringify({ error: "Message/prompt is required" }), { status: 400 });
    }

    // Format history for Bedrock agent if provided
    let inputText = prompt;
    if (history.length > 0) {
      // Format history as context for the agent
      const formattedHistory = history
        .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');
      
      // Add history as context before the current prompt
      inputText = `${formattedHistory}\n\nHuman: ${prompt}`;
      
      console.log("[DEBUG] Formatted input with history:", 
        inputText.length > 100 ? 
        `${inputText.substring(0, 100)}... (${inputText.length} chars)` : 
        inputText);
    }

    const client = new BedrockAgentRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
    });

    // Ensure we have a consistent session ID
    const effectiveSessionId = sessionId || `session-${Date.now()}`;
    console.log("[DEBUG] Using session ID:", effectiveSessionId);
    
    const command = new InvokeAgentCommand({
      agentId: process.env.BEDROCK_AGENT_ID || "FRVW3VGKLH",
      agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID || "TSTALIASID",
      sessionId: effectiveSessionId,
      inputText: inputText,
    });

    const response = await client.send(command);
    console.log("[DEBUG] Bedrock agent response received");

    let completionText = "";
    let files: Array<{ name: string; type: string; data: string }> = [];

    if (response.completion) {
      console.log("[DEBUG] Processing completion stream...");

      for await (const chunk of response.completion) {
        console.log("[DEBUG] Chunk keys:", Object.keys(chunk));

        // Handle text content
        if (chunk.chunk?.bytes) {
          const text = new TextDecoder().decode(chunk.chunk.bytes);
          completionText += text;
          console.log("[DEBUG] Text chunk received");
        }

        // ✅ Handle files using the proven method
        function deepSearch(obj: any, path = "") {
          if (typeof obj !== "object" || obj === null) return;

          if (obj.name && obj.type && obj.bytes && typeof obj.name === "string") {
            console.log(`[DEBUG] Found file: ${obj.name} at ${path}`);

            try {
              // Convert bytes object to Uint8Array
              const byteKeys = Object.keys(obj.bytes)
                .map(Number)
                .sort((a, b) => a - b);
              const byteArray = new Uint8Array(byteKeys.map((key) => obj.bytes[key]));

              // Convert to base64
              const base64 = Buffer.from(byteArray).toString("base64");

              files.push({
                name: obj.name,
                type: obj.type,
                data: base64,
              });

              console.log(`[DEBUG] File processed: ${obj.name}, size: ${byteArray.length} bytes`);
            } catch (error) {
              console.error(`[DEBUG] Error processing file ${obj.name}:`, error);
            }
          }

          // Recursively search
          for (const [key, value] of Object.entries(obj)) {
            if (typeof value === "object" && value !== null) {
              deepSearch(value, path ? `${path}.${key}` : key);
            }
          }
        }

        deepSearch(chunk);
      }
    }

    console.log("[DEBUG] Final results:");
    console.log("- Text length:", completionText.length);
    console.log("- Files found:", files.length);

    // ✅ Deduplicate files
    const uniqueFiles = files.filter(
      (file, index, self) => index === self.findIndex((f) => f.name === file.name && f.data === file.data),
    );

    console.log("- Unique files:", uniqueFiles.length);

    return new Response(
      JSON.stringify({
        text: completionText,
        files: uniqueFiles,
        sessionId: effectiveSessionId, // Return the session ID for client-side persistence
      }),
    );
  } catch (error: unknown) {
    console.error("[ERROR] Bedrock agent error:", error);
    
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        text: `Error: ${errorMessage}. Please try again or contact support if the issue persists.`
      }),
      { status: 500 }
    );
  }
}
