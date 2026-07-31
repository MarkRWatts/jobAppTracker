"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ApplicationStatus, Source } from "@/generated/prisma/enums";
import { moveApplicationStatus } from "@/lib/applications/statusEvents";
import { SOURCE_LABELS, STATUS_LABELS, daysSince, cvCoverLetterSummary } from "@/lib/format";
import { PIPELINE_STATUSES, CLOSED_STATUSES, CLOSED_COLUMN_ID } from "@/lib/board";

type BoardApplication = {
  id: string;
  jobTitle: string;
  currentStatus: ApplicationStatus;
  source: Source;
  usedCustomCv: boolean;
  usedCoverLetter: boolean;
  company: { name: string };
  statusEvents: { occurredAt: Date }[];
};

export function Board({
  applications,
  statusFilter,
}: {
  applications: BoardApplication[];
  statusFilter: ApplicationStatus[];
}) {
  const [closedExpanded, setClosedExpanded] = useState(false);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  // A completed drag (distance >= the activation constraint above) still ends
  // with the pointer over the dragged card's own link, since it isn't a
  // DragOverlay — it's the real card, moved with a CSS transform. That makes
  // the browser fire a click on it right after drop. onDragStart only fires
  // once the activation constraint is met, so it's a reliable "a real drag
  // just happened" signal — suppress the very next click on any card link.
  const justDraggedRef = useRef(false);

  function handleDragStart() {
    justDraggedRef.current = true;
  }

  function handleCardLinkClick(event: React.MouseEvent) {
    if (justDraggedRef.current) {
      event.preventDefault();
      justDraggedRef.current = false;
    }
  }

  const byStatus = new Map<ApplicationStatus, BoardApplication[]>();
  for (const application of applications) {
    const list = byStatus.get(application.currentStatus) ?? [];
    list.push(application);
    byStatus.set(application.currentStatus, list);
  }

  const statusFilterActive = statusFilter.length > 0;
  const openStatuses = statusFilterActive ? PIPELINE_STATUSES.filter((s) => statusFilter.includes(s)) : PIPELINE_STATUSES;
  const showMergedClosed = !statusFilterActive || CLOSED_STATUSES.every((s) => statusFilter.includes(s));
  const partialClosedStatuses =
    statusFilterActive && !showMergedClosed ? CLOSED_STATUSES.filter((s) => statusFilter.includes(s)) : [];

  function handleDragEnd(event: DragEndEvent) {
    const applicationId = String(event.active.id);
    const overId = event.over?.id;
    if (!overId) return;
    const newStatus = String(overId) as ApplicationStatus;
    const current = applications.find((a) => a.id === applicationId);
    if (!current || current.currentStatus === newStatus) return;
    startTransition(() => {
      moveApplicationStatus(applicationId, newStatus);
    });
  }

  return (
    <DndContext id="applications-board" sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex items-start gap-4 overflow-x-auto pb-4">
        {openStatuses.map((status) => (
          <Column
            key={status}
            id={status}
            title={STATUS_LABELS[status]}
            applications={byStatus.get(status) ?? []}
            onCardLinkClick={handleCardLinkClick}
          />
        ))}
        {partialClosedStatuses.map((status) => (
          <Column
            key={status}
            id={status}
            title={STATUS_LABELS[status]}
            applications={byStatus.get(status) ?? []}
            onCardLinkClick={handleCardLinkClick}
          />
        ))}
        {showMergedClosed &&
          (closedExpanded ? (
            CLOSED_STATUSES.map((status) => (
              <Column
                key={status}
                id={status}
                title={STATUS_LABELS[status]}
                applications={byStatus.get(status) ?? []}
                onCardLinkClick={handleCardLinkClick}
              />
            ))
          ) : (
            <ClosedColumn
              applications={CLOSED_STATUSES.flatMap((s) => byStatus.get(s) ?? [])}
              onExpand={() => setClosedExpanded(true)}
              onCardLinkClick={handleCardLinkClick}
            />
          ))}
        {showMergedClosed && closedExpanded && (
          <button
            type="button"
            onClick={() => setClosedExpanded(false)}
            className="mt-6 shrink-0 rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Collapse closed
          </button>
        )}
      </div>
    </DndContext>
  );
}

function Column({
  id,
  title,
  applications,
  onCardLinkClick,
}: {
  id: string;
  title: string;
  applications: BoardApplication[];
  onCardLinkClick: (event: React.MouseEvent) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="flex w-64 shrink-0 flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</h3>
        <span className="text-xs text-zinc-400">{applications.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-24 flex-col gap-2 rounded-lg border border-dashed p-2 transition-colors ${
          isOver ? "border-zinc-400 bg-zinc-100 dark:border-zinc-500 dark:bg-zinc-800" : "border-zinc-200 dark:border-zinc-800"
        }`}
      >
        {applications.map((application) => (
          <Card key={application.id} application={application} onLinkClick={onCardLinkClick} />
        ))}
      </div>
    </div>
  );
}

function ClosedColumn({
  applications,
  onExpand,
  onCardLinkClick,
}: {
  applications: BoardApplication[];
  onExpand: () => void;
  onCardLinkClick: (event: React.MouseEvent) => void;
}) {
  // Not a real drop target while collapsed — ambiguous which closed status a
  // card dropped here should get, so dragging in requires expanding first.
  const { setNodeRef } = useDroppable({ id: CLOSED_COLUMN_ID, disabled: true });
  return (
    <div className="flex w-64 shrink-0 flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={onExpand}
          className="text-sm font-semibold text-zinc-700 hover:underline dark:text-zinc-300"
        >
          Closed
        </button>
        <span className="text-xs text-zinc-400">{applications.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className="flex min-h-24 flex-col gap-2 rounded-lg border border-dashed border-zinc-200 p-2 dark:border-zinc-800"
      >
        {applications.length === 0 ? (
          <p className="px-1 text-xs text-zinc-400">Nothing closed yet.</p>
        ) : (
          applications.map((application) => (
            <Card key={application.id} application={application} onLinkClick={onCardLinkClick} />
          ))
        )}
        <button
          type="button"
          onClick={onExpand}
          className="px-1 text-left text-xs text-zinc-400 underline hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Expand to move cards here
        </button>
      </div>
    </div>
  );
}

function Card({ application, onLinkClick }: { application: BoardApplication; onLinkClick: (event: React.MouseEvent) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: application.id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const latestEvent = application.statusEvents[0];
  const cvCoverLetter = cvCoverLetterSummary(application.usedCustomCv, application.usedCoverLetter);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`touch-none rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <Link href={`/applications/${application.id}`} className="flex flex-col gap-1" draggable={false} onClick={onLinkClick}>
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{application.jobTitle}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{application.company.name}</span>
        <div className="flex items-center justify-between pt-1">
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {SOURCE_LABELS[application.source]}
          </span>
          {latestEvent && <span className="text-[11px] text-zinc-400">{daysSince(latestEvent.occurredAt)}</span>}
        </div>
        {cvCoverLetter && <span className="text-[11px] text-zinc-400">{cvCoverLetter}</span>}
      </Link>
    </div>
  );
}
