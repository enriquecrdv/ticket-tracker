import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div className="min-w-0"><p className="text-sm font-bold text-blue-600">{eyebrow}</p><h1 className="mt-0.5 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h1><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{description}</p></div>
    {action && <div className="shrink-0">{action}</div>}
  </div>;
}
