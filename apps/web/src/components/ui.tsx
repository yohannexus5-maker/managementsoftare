import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("rounded-xl border border-ink-200 bg-white shadow-sm", className)}
      {...props}
    />
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" && "bg-ink-900 text-white hover:bg-ink-800",
        variant === "secondary" && "bg-white border border-ink-300 text-ink-700 hover:bg-ink-50",
        variant === "ghost" && "text-ink-600 hover:bg-ink-100",
        variant === "danger" && "bg-danger-600 text-white hover:opacity-90",
        className
      )}
      {...props}
    />
  );
}

const STATUS_TONE: Record<string, string> = {
  ACTIVE: "bg-ok-100 text-ok-600",
  APPROVED: "bg-ok-100 text-ok-600",
  DONE: "bg-ok-100 text-ok-600",
  PAID: "bg-ok-100 text-ok-600",
  COMPLETE: "bg-ok-100 text-ok-600",
  COMPLETED: "bg-ok-100 text-ok-600",
  ISSUED: "bg-ok-100 text-ok-600",
  RESPONDED: "bg-ok-100 text-ok-600",
  PENDING: "bg-warn-100 text-warn-600",
  IN_PROGRESS: "bg-warn-100 text-warn-600",
  WIP: "bg-warn-100 text-warn-600",
  SENT: "bg-warn-100 text-warn-600",
  SUBMITTED: "bg-warn-100 text-warn-600",
  UNDER_REVIEW: "bg-warn-100 text-warn-600",
  PARTIALLY_PAID: "bg-warn-100 text-warn-600",
  REVIEW: "bg-warn-100 text-warn-600",
  OPEN: "bg-accent-100 text-accent-700",
  TODO: "bg-ink-100 text-ink-600",
  DRAFT: "bg-ink-100 text-ink-600",
  ON_HOLD: "bg-ink-100 text-ink-600",
  OVERDUE: "bg-danger-100 text-danger-600",
  REJECTED: "bg-danger-100 text-danger-600",
  CANCELLED: "bg-danger-100 text-danger-600",
  TERMINATED: "bg-danger-100 text-danger-600",
  CLOSED: "bg-ink-100 text-ink-600",
};

export function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "bg-ink-100 text-ink-600";
  return (
    <span className={clsx("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", tone)}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-300 py-16 text-center">
      <div className="text-sm font-medium text-ink-700">{title}</div>
      {description && <div className="mt-1 text-sm text-ink-500">{description}</div>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-ink-600" />
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-500 focus:outline-none focus:ring-1 focus:ring-ink-500",
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        "w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 focus:border-ink-500 focus:outline-none focus:ring-1 focus:ring-ink-500",
        props.className
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        "w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-500 focus:outline-none focus:ring-1 focus:ring-ink-500",
        props.className
      )}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-xs font-medium text-ink-600">{children}</label>;
}

export function Field({ children }: { children: ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
