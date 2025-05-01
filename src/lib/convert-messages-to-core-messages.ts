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
                type: "image" as const,
                mimeType: match.groups.mime,
                image: Buffer.from(match.groups.data, "base64") as Uint8Array,
              };
            }),
          ],
        };
      default:
        return { role: "assistant", content: m.content };
    }
  });
}
