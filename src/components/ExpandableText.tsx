"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

const clampStyle = (lines: number): CSSProperties => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: lines,
  overflow: "hidden",
});

export function ExpandableText({ text, lines = 10 }: { text: string; lines?: number }) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncatable, setIsTruncatable] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Measured while collapsed (the clamp style is applied) on mount, so
    // this compares the clamped height against the text's natural height.
    setIsTruncatable(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  return (
    <div className="flex flex-col gap-2">
      <p
        ref={ref}
        style={expanded ? undefined : clampStyle(lines)}
        className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300"
      >
        {text}
      </p>
      {isTruncatable && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="self-start text-xs font-medium text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
