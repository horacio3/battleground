import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";

const config = {
  region: "us-east-1",
};

const agentId = "FRVW3VGKLH";
const agentAliasId = "TSTALIASID";
const sessionId = `test-session-${Date.now()}`;

// More specific prompts that might trigger diagram generation
const prompts = [
  "Create a bar chart showing sales data and save it as an image file",
  "Generate an AWS architecture diagram with API Gateway, Lambda, and DynamoDB",
  "Create a simple flowchart diagram and export it as PNG",
  "Draw a system architecture diagram",
];

async function testDiagramGeneration() {
  const client = new BedrockAgentRuntimeClient(config);

  for (const [index, prompt] of prompts.entries()) {
    console.log(`\n🧪 Test ${index + 1}: "${prompt}"`);

    const command = new InvokeAgentCommand({
      agentId,
      agentAliasId,
      sessionId: `${sessionId}-${index}`,
      inputText: prompt,
    });

    try {
      const response = await client.send(command);

      if (response.completion) {
        let textContent = "";
        let allFiles = [];
        let chunkCount = 0;

        for await (const chunk of response.completion) {
          chunkCount++;
          console.log(`\n📦 Chunk ${chunkCount} structure:`, JSON.stringify(chunk, null, 2));

          // Handle text content
          if (chunk.chunk?.bytes) {
            const decoded = new TextDecoder().decode(chunk.chunk.bytes);
            textContent += decoded;
            console.log(`📝 Text chunk: ${decoded.substring(0, 100)}...`);
          }

          // Your existing file detection logic
          let foundFiles = [];

          // Method 1: Direct files property
          if (chunk.files) {
            foundFiles.push(...(Array.isArray(chunk.files) ? chunk.files : [chunk.files]));
          }

          // Method 2: Look for file-related properties
          for (const [key, value] of Object.entries(chunk)) {
            if (key.toLowerCase().includes("file") && value && key !== "files") {
              foundFiles.push(...(Array.isArray(value) ? value : [value]));
            }
          }

          // Method 3: Check for trace information (agents often include execution traces)
          if (chunk.trace) {
            console.log(`🔍 Trace info:`, JSON.stringify(chunk.trace, null, 2));
          }

          // Process found files
          if (foundFiles.length > 0) {
            console.log(`🎉 Found ${foundFiles.length} file(s) in chunk ${chunkCount}!`);
            // Your existing file processing logic here
          }
        }

        console.log(`\n📊 Test ${index + 1} Summary:`);
        console.log(`- Chunks: ${chunkCount}`);
        console.log(`- Text length: ${textContent.length}`);
        console.log(`- Files found: ${allFiles.length}`);
        console.log(`- Response preview: ${textContent.substring(0, 200)}...`);
      }
    } catch (error) {
      console.error(`❌ Test ${index + 1} failed:`, error.message);
    }
  }
}

testDiagramGeneration();
