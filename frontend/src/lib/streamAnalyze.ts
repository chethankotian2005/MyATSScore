import { getApiHeaders } from "./api";

export async function streamAnalyze(
  formData: FormData,
  token: string | null,
  onScore: (data: any, parsedResume: any, scanId?: string) => void,
  onChunk: (content: string) => void,
  onDone: (data: any) => void,
  onError: (message: string) => void
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const headers = getApiHeaders(token);

  let retries = 0;
  const maxRetries = 1;

  async function attempt() {
    try {
      const response = await fetch(`${apiUrl}/api/v1/analyze/stream`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No readable stream");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          const jsonStr = trimmed.slice(6);
          try {
            const event = JSON.parse(jsonStr);
            switch (event.type) {
              case "score":
                onScore(event.data, event.parsed_resume, event.scan_id);
                break;
              case "chunk":
                onChunk(event.content);
                break;
              case "done":
                onDone(event.data);
                break;
              case "error":
                onError(event.message);
                break;
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim().startsWith("data: ")) {
        try {
          const event = JSON.parse(buffer.trim().slice(6));
          if (event.type === "done") onDone(event.data);
          if (event.type === "error") onError(event.message);
        } catch {}
      }
    } catch (err: any) {
      if (retries < maxRetries) {
        retries++;
        await new Promise((r) => setTimeout(r, 2000));
        return attempt();
      }
      onError(err.message || "Connection failed");
    }
  }

  await attempt();
}
