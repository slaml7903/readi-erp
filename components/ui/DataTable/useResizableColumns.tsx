"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export type ResizableColumnDefinition = {
  key: string;
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
};

type ResizeSession = {
  key: string;
  startX: number;
  startWidth: number;
  currentWidth: number;
  minWidth: number;
  maxWidth: number;
};

export function useResizableColumns(
  tableId: string,
  columns: readonly ResizableColumnDefinition[]
) {
  const storageKey = `erp-table-widths:${tableId}`;
  const [widths, setWidths] = useState<Record<string, number>>({});
  const resizeSession = useRef<ResizeSession | undefined>(undefined);
  const previousUserSelect = useRef("");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Record<string, unknown>;
      const valid = Object.fromEntries(
        columns.flatMap((column) => {
          const value = parsed[column.key];
          const minWidth = column.minWidth ?? 70;
          const maxWidth = column.maxWidth ?? 800;
          return typeof value === "number" && Number.isFinite(value)
            ? [[column.key, clamp(value, minWidth, maxWidth)]]
            : [];
        })
      );
      // Stored browser preferences are intentionally applied after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWidths(valid);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [columns, storageKey]);

  useEffect(
    () => () => {
      document.body.style.userSelect = previousUserSelect.current;
    },
    []
  );

  const persist = (nextWidths: Record<string, number>) => {
    try {
      if (Object.keys(nextWidths).length === 0) {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, JSON.stringify(nextWidths));
      }
    } catch {
      // Storage can be unavailable in private browsing; resizing still works.
    }
  };

  const getColumnStyle = (key: string): CSSProperties => {
    const column = columns.find((candidate) => candidate.key === key);
    if (!column) return {};
    const width = widths[key] ?? column.defaultWidth;
    return {
      width,
      minWidth: column.minWidth ?? 70,
      maxWidth: column.maxWidth ?? 800,
    };
  };

  const resetColumn = (key: string) => {
    setWidths((current) => {
      const next = { ...current };
      delete next[key];
      persist(next);
      return next;
    });
  };

  const resetAll = () => {
    setWidths({});
    persist({});
  };

  const renderResizeHandle = (key: string): ReactNode => {
    const column = columns.find((candidate) => candidate.key === key);
    if (!column) return null;

    const handlePointerDown = (event: ReactPointerEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const header = event.currentTarget.parentElement;
      const startWidth = header?.getBoundingClientRect().width ?? column.defaultWidth;
      const minWidth = column.minWidth ?? 70;
      const maxWidth = column.maxWidth ?? 800;
      resizeSession.current = {
        key,
        startX: event.clientX,
        startWidth,
        currentWidth: startWidth,
        minWidth,
        maxWidth,
      };
      previousUserSelect.current = document.body.style.userSelect;
      document.body.style.userSelect = "none";
      event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
      const session = resizeSession.current;
      if (!session || session.key !== key) return;
      event.preventDefault();
      const nextWidth = clamp(
        session.startWidth + event.clientX - session.startX,
        session.minWidth,
        session.maxWidth
      );
      session.currentWidth = nextWidth;
      setWidths((current) => ({ ...current, [key]: nextWidth }));
    };

    const handlePointerUp = (event: ReactPointerEvent<HTMLSpanElement>) => {
      const session = resizeSession.current;
      if (!session || session.key !== key) return;
      event.preventDefault();
      event.stopPropagation();
      resizeSession.current = undefined;
      document.body.style.userSelect = previousUserSelect.current;
      setWidths((current) => {
        const next = { ...current, [key]: session.currentWidth };
        persist(next);
        return next;
      });
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    };

    return (
      <span
        role="separator"
        aria-orientation="vertical"
        aria-label={`${key} 컬럼 너비 조절`}
        title="드래그하여 너비 조절 · 더블클릭하여 초기화"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          resetColumn(key);
        }}
        className="absolute inset-y-0 right-0 z-20 w-2 cursor-col-resize touch-none select-none before:absolute before:inset-y-1 before:left-1/2 before:w-px before:bg-transparent hover:before:bg-blue-400"
      />
    );
  };

  return {
    getColumnStyle,
    renderResizeHandle,
    resetAll,
    hasCustomWidths: Object.keys(widths).length > 0,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max);
}
