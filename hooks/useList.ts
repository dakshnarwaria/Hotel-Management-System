"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApi } from "@/hooks/useApi";

type ListData<T, S> = {
  rows: T[];
  summary: S | null;
};

type ListState<T, S> = ListData<T, S> & {
  loading: boolean;
  error: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readListData<T, S>(data: unknown): ListData<T, S> {
  if (Array.isArray(data)) return { rows: data as T[], summary: null };
  if (!isRecord(data)) throw new Error("List response has an invalid shape");

  const rows = [data.rows, data.bookings, data.payments, data.orders].find(
    Array.isArray,
  );
  if (!rows) throw new Error("List response does not contain a rows array");

  const summary =
    data.summary ??
    data.counts ??
    (typeof data.rowCount === "number" ? { rowCount: data.rowCount } : null);
  return { rows: rows as T[], summary: summary as S | null };
}

export function useList<T, S = unknown>(
  url: string,
  params: Record<string, string | number | undefined>,
) {
  const request = useApi();
  const [state, setState] = useState<ListState<T, S>>({
    rows: [],
    summary: null,
    loading: true,
    error: null,
  });
  const [refreshVersion, setRefreshVersion] = useState(0);
  const requestId = useRef(0);
  const paramsString = new URLSearchParams(
    Object.entries(params)
      .filter(
        (entry): entry is [string, string | number] =>
          entry[1] !== undefined && entry[1] !== "",
      )
      .map(([key, value]) => [key, String(value)]),
  ).toString();

  const refresh = useCallback(() => {
    setRefreshVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    window.addEventListener("hotel:data-change", refresh);
    return () => window.removeEventListener("hotel:data-change", refresh);
  }, [refresh]);

  useEffect(() => {
    const id = ++requestId.current;
    const controller = new AbortController();
    const queryString = paramsString ? `?${paramsString}` : "";
    const endpoint = `${url}${queryString}`;

    setState((current) => ({ ...current, loading: true, error: null }));

    async function fetchList() {
      try {
        const data = await request<unknown>(endpoint, {
          signal: controller.signal,
        });
        if (controller.signal.aborted || id !== requestId.current) return;
        const result = readListData<T, S>(data);
        setState({
          ...result,
          loading: true,
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted || id !== requestId.current) return;
        setState((current) => ({
          ...current,
          error: error instanceof Error ? error.message : "List request failed",
        }));
      } finally {
        if (!controller.signal.aborted && id === requestId.current) {
          setState((current) => ({ ...current, loading: false }));
        }
      }
    }

    void fetchList();
    return () => controller.abort();
  }, [paramsString, refreshVersion, request, url]);

  return { ...state, refresh };
}
