"use client";

import { useCallback } from "react";
import { useToast } from "@/components/Toast";

type ApiEnvelope<T> = {
  ok: boolean;
  data: T | null;
  error: string | null;
};

type PendingResponse = {
  responseOk: boolean;
  result: ApiEnvelope<unknown>;
};

const pendingGetRequests = new Map<string, Promise<PendingResponse>>();

function abortable<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) {
    return Promise.reject(new DOMException("The request was aborted", "AbortError"));
  }

  return new Promise<T>((resolve, reject) => {
    const cleanup = () => signal.removeEventListener("abort", onAbort);
    const onAbort = () => {
      cleanup();
      reject(new DOMException("The request was aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error: unknown) => {
        cleanup();
        reject(error);
      },
    );
  });
}

function getRequestKey(input: RequestInfo | URL, headers: Headers) {
  const url =
    input instanceof Request
      ? input.url
      : input instanceof URL
        ? input.href
        : input;
  const headerKey = [...headers.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}:${value}`)
    .join("\n");
  return `${url}\n${headerKey}`;
}

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
        let responseOk: boolean;
        let result: ApiEnvelope<T>;
        if ((init?.method ?? "GET").toUpperCase() === "GET" && !init?.body) {
          const key = getRequestKey(input, headers);
          let pending = pendingGetRequests.get(key);
          if (!pending) {
            const requestInit = { ...init };
            delete requestInit.signal;
            pending = fetch(input, {
              ...requestInit,
              headers,
              cache: "no-store",
            })
              .then(async (response) => ({
                responseOk: response.ok,
                result: (await response.json()) as ApiEnvelope<unknown>,
              }))
              .finally(() => pendingGetRequests.delete(key));
            pendingGetRequests.set(key, pending);
          }
          const response = await abortable(pending, init?.signal ?? undefined);
          responseOk = response.responseOk;
          result = response.result as ApiEnvelope<T>;
        } else {
          const response = await fetch(input, { ...init, headers });
          responseOk = response.ok;
          result = (await response.json()) as ApiEnvelope<T>;
        }
        if (!responseOk || !result.ok) {
          throw new Error(result.error ?? "Request failed");
        }
        if (typeof window !== "undefined" && init?.method && init.method !== "GET") {
          window.dispatchEvent(new Event("hotel:data-change"));
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
