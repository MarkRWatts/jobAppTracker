import type { Prisma } from "@/generated/prisma/client";
import { Source, ApplicationStatus } from "@/generated/prisma/enums";

export type SearchParams = Record<string, string | string[] | undefined>;

export type ApplicationFilters = {
  sources: Source[];
  statuses: ApplicationStatus[];
  from: string | null; // yyyy-mm-dd, as typed into a date input
  to: string | null;
};

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function parseFilters(searchParams: SearchParams): ApplicationFilters {
  const sources = toArray(searchParams.source).filter((v): v is Source => v in Source);
  const statuses = toArray(searchParams.status).filter((v): v is ApplicationStatus => v in ApplicationStatus);
  const from = typeof searchParams.from === "string" && searchParams.from !== "" ? searchParams.from : null;
  const to = typeof searchParams.to === "string" && searchParams.to !== "" ? searchParams.to : null;
  return { sources, statuses, from, to };
}

export function buildWhere(filters: ApplicationFilters): Prisma.ApplicationWhereInput {
  const where: Prisma.ApplicationWhereInput = {};
  if (filters.sources.length > 0) where.source = { in: filters.sources };
  if (filters.statuses.length > 0) where.currentStatus = { in: filters.statuses };
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00`) } : {}),
      ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59`) } : {}),
    };
  }
  return where;
}

/** Query-string params to carry over when navigating between views/sorts, e.g. via a Link's href. */
export function filterSearchParams(filters: ApplicationFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const source of filters.sources) params.append("source", source);
  for (const status of filters.statuses) params.append("status", status);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  return params;
}

export type SortField = "jobTitle" | "company" | "source" | "status" | "createdAt";
export type ApplicationSort = { field: SortField; dir: "asc" | "desc" };

const SORT_FIELDS: SortField[] = ["jobTitle", "company", "source", "status", "createdAt"];

export function parseSort(searchParams: SearchParams): ApplicationSort {
  const field = searchParams.sort;
  const dir = searchParams.dir;
  return {
    field: typeof field === "string" && (SORT_FIELDS as string[]).includes(field) ? (field as SortField) : "createdAt",
    dir: dir === "asc" ? "asc" : "desc",
  };
}

/** Query params for a sortable column header link — toggles direction when already sorted by this field. */
export function sortSearchParams(field: SortField, current: ApplicationSort, filters: ApplicationFilters): URLSearchParams {
  const params = filterSearchParams(filters);
  const nextDir = current.field === field && current.dir === "asc" ? "desc" : "asc";
  params.set("sort", field);
  params.set("dir", nextDir);
  return params;
}

export function buildOrderBy(sort: ApplicationSort): Prisma.ApplicationOrderByWithRelationInput {
  switch (sort.field) {
    case "company":
      return { company: { name: sort.dir } };
    case "status":
      return { currentStatus: sort.dir };
    default:
      return { [sort.field]: sort.dir };
  }
}
