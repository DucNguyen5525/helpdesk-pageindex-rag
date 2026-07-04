import type { DocumentStatus } from "@helpdesk/shared";

const styles: Record<DocumentStatus, string> = {
  ready: "bg-emerald-100 text-emerald-800",
  processing: "bg-amber-100 text-amber-800",
  failed: "bg-rose-100 text-rose-800"
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${styles[status]}`}>{status}</span>;
}
