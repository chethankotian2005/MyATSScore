"use client";
import { useState, useCallback } from "react";
import { useAnalyzeStore } from "@/store/analyzeStore";
import { streamAnalyze } from "@/lib/streamAnalyze";

export type StreamStatus = "idle" | "uploading" | "scoring" | "streaming" | "done" | "error";

export interface StreamState {
  status: StreamStatus;
  score: any | null;
  parsedResume: any | null;
  streamingText: string;
  insights: any | null;
  error: string | null;
}

export function useStreamAnalyze() {
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [score, setScore] = useState<any | null>(null);
  const [parsedResume, setParsedResume] = useState<any | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [insights, setInsights] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setScore(null);
    setParsedResume(null);
    setStreamingText("");
    setInsights(null);
    setError(null);
  }, []);

  const startAnalysis = useCallback(async (file: File, jobDescription: string) => {
    reset();
    setStatus("uploading");

    const formData = new FormData();
    formData.append("file", file);
    if (jobDescription.trim()) {
      formData.append("job_description", jobDescription);
    }

    let token: string | null = null;
    try {
      const { getCurrentUserToken } = await import("@/lib/firebase");
      token = await getCurrentUserToken();
    } catch {}

    setStatus("scoring");

    await streamAnalyze(
      formData,
      token,
      // onScore
      (data, parsedRes, scanId) => {
        setScore(data);
        setParsedResume(parsedRes);
        setStatus("streaming");
        if (scanId) {
          useAnalyzeStore.getState().setScanId(scanId);
        }
      },
      // onChunk
      (content) => {
        setStreamingText((prev) => prev + content);
      },
      // onDone
      (data) => {
        setInsights(data);
        setStatus("done");
      },
      // onError
      (message) => {
        setError(message);
        setStatus("error");
      }
    );
  }, [reset]);

  return { status, score, parsedResume, streamingText, insights, error, startAnalysis, reset };
}
