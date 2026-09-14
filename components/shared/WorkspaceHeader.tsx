"use client";

import type { ComponentType, ReactNode } from "react";

export type WorkspaceNavItem<T extends string> = {
  id: T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
};

export function WorkspaceHeader<T extends string>({ eyebrow, title, active, items, onNavigate, onHome, actions }: {
  eyebrow: string;
  title: string;
  active: T;
  items: readonly WorkspaceNavItem<T>[];
  onNavigate: (section: T) => void;
  onHome: () => void;
  actions: ReactNode;
}) {
  return <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950 text-white shadow-lg shadow-slate-950/10">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
      <button onClick={onHome} aria-label="Ir al resumen" className="flex min-w-0 items-center gap-3 rounded-xl text-left transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-sm font-black shadow-lg shadow-blue-900/40">SP</span>
        <span className="min-w-0"><span className="block truncate text-[11px] font-bold uppercase tracking-widest text-blue-300">{eyebrow}</span><span className="block truncate text-base font-black sm:text-lg">{title}</span></span>
      </button>
      <div className="flex shrink-0 items-center gap-1">{actions}</div>
    </div>
    <nav aria-label={`Secciones de ${title}`} className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6">
      {items.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => onNavigate(item.id)} aria-current={active === item.id ? "page" : undefined} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${active === item.id ? "bg-blue-600 text-white shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>{Icon && <Icon className="h-4 w-4" />}{item.label}</button>; })}
    </nav>
  </header>;
}
