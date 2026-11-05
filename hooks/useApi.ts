"use client";

import { useCallback } from "react";
import { useToast } from "@/components/Toast";

type ApiEnvelope<T> = {
  ok: boolean;
  data: T | null;
  error: string | null;
};

export function useApi() {
  const { toast } = useToast();

  return useCallback(
    async function request<T>(
      input: RequestInfo | URL,
      init?: RequestInit,
      successMessage?: string,
    ): Promise<T> {
      try {
        const headers = new Headers(init?.headers);
        if (init?.body && !headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }
        const response = await fetch(input, { ...init, headers });
        const result = (await response.json()) as ApiEnvelope<T>;
        if (!response.ok || !result.ok) {
          throw new Error(result.error ?? "Request failed");
        }
        if (successMessage) toast(successMessage, "success");
        return result.data as T;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw error;
        }
        const message =
          error instanceof Error ? error.message : "Request failed";
        toast(message, "error");
        throw error instanceof Error ? error : new Error(message);
      }
    },
    [toast],
  );
}
