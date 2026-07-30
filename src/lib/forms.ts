export function textOrNull(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function requiredText(formData: FormData, key: string, label: string): string {
  const value = textOrNull(formData, key);
  if (!value) throw new Error(`${label} is required`);
  return value;
}

/** Parses a `datetime-local` input value, falling back to now if missing/invalid. */
export function parseOccurredAt(formData: FormData, key = "occurredAt"): Date {
  const value = formData.get(key);
  if (typeof value === "string" && value !== "") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}
