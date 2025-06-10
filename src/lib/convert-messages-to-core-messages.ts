import { ImageData } from "@/types/image-data.type";
import { CoreMessage, Message } from "ai";

export function convertAiMessagesToCoreMessages(messages: Message[]): CoreMessage[] {
  return messages.map((m) => {
    switch (m.role) {
      case "user":
        const images = (m.data as any)?.images as ImageData[];
        if (!images?.length) {
          return { role: "user", content: [{ type: "text", text: m.content }] };
        }
        return {
          role: "user",
          content: [
            ...(m.content ? [{ type: "text", text: m.content }] : ([] as any)),
            ...images.map((image) => {
              var regex = /data:(?<mime>[\w/\-\.\+]+);(?<encoding>\w+),(?<data>.*)/;
              var match = regex.exec(image.dataUrl);
              if (!match || !match.groups) throw new Error("Invalid image data URL");
              return {
                type: "file" as const,
                mimeType: match.groups.mime,
                data: Buffer.from(match.groups.data, "base64") as Uint8Array,
              };
            }),
          ],
        };
      case "assistant":
        // Handle assistant messages that may contain image data
        const content = m.content;
        if (typeof content === "string") {
          // Check if the content contains an image data URL
          const imageMatch = content.match(/data:(?<mime>[\w/\-\.\+]+);(?<encoding>\w+),(?<data>.*)/);
          if (imageMatch?.groups) {
            return {
              role: "assistant",
              content: [
                {
                  type: "file" as const,
                  mimeType: imageMatch.groups.mime,
                  data: Buffer.from(imageMatch.groups.data, "base64") as Uint8Array,
                },
              ],
            };
          }
          // If no image, return as text
          return { role: "assistant", content: [{ type: "text", text: content }] };
        }
        // If content is already an array (mixed content), return as is
        return { role: "assistant", content };
      default:
        return { role: "assistant", content: m.content };
    }
  });
}
