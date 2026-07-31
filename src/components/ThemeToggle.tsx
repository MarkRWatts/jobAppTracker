"use client";

import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

function computeIsDark(theme: Theme): boolean {
  return theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

// A minimal external store so useSyncExternalStore can read localStorage
// without SSR/hydration mismatches (getServerSnapshot below covers the
// server + first client render; the real value lands right after).
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): Theme {
  return readStoredTheme();
}

function getServerSnapshot(): Theme {
  return "system";
}

function setTheme(next: Theme) {
  if (next === "system") {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, next);
  }
  listeners.forEach((listener) => listener());
}

const OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "☀️" },
  { value: "dark", label: "Dark", icon: "🌙" },
  { value: "system", label: "System", icon: "🖥️" },
];

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", computeIsDark(theme));
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => document.documentElement.classList.toggle("dark", computeIsDark("system"));
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-zinc-200 p-0.5 dark:border-zinc-700">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setTheme(option.value)}
          aria-label={`${option.label} theme`}
          aria-pressed={theme === option.value}
          title={option.label}
          className={`rounded px-1.5 py-1 text-sm leading-none ${
            theme === option.value ? "bg-zinc-900 dark:bg-zinc-100" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}
