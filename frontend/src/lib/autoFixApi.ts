import { getApiHeaders } from "./api";

/**
 * Auto-Fix API client — SSE stream to POST /api/v1/auto-fix
 * Same pattern as streamAnalyze.ts but sends JSON body instead of FormData.
 */
export interface AutoFixParams {
  resume_text: string;
  score_data: any;
  insights: any;
  scan_id?: string;
}

export async function callAutoFix(
  params: AutoFixParams,
  token: string | null,
  onStep: (step: number) => void,
  onDone: (data: any) => void,
  onError: (message: string) => void
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const headers = getApiHeaders(token);
  headers["Content-Type"] = "application/json";

  try {
    const response = await fetch(`${apiUrl}/api/v1/auto-fix`, {
      method: "POST",
      headers,
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status}: ${errText}`);
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
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;

        const jsonStr = trimmed.slice(6);
        try {
          const event = JSON.parse(jsonStr);
          switch (event.type) {
            case "step":
              onStep(event.step);
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

    // Process remaining buffer
    if (buffer.trim().startsWith("data: ")) {
      try {
        const event = JSON.parse(buffer.trim().slice(6));
        if (event.type === "done") onDone(event.data);
        if (event.type === "error") onError(event.message);
      } catch {}
    }
  } catch (err: any) {
    onError(err.message || "Auto-fix connection failed");
  }
}
