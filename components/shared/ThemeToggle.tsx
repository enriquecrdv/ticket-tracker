"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = window.localStorage.getItem("support-theme");
    const enabled = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", enabled);
    document.documentElement.dataset.theme = enabled ? "dark" : "light";
    queueMicrotask(() => setDark(enabled));
  }, []);
  function toggle() {
    const enabled = !dark;
    setDark(enabled);
    document.documentElement.classList.toggle("dark", enabled);
    document.documentElement.dataset.theme = enabled ? "dark" : "light";
    window.localStorage.setItem("support-theme", enabled ? "dark" : "light");
  }
  return <button type="button" role="switch" aria-checked={dark} onClick={toggle} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><span className="flex items-center gap-3">{dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}Modo oscuro</span><span className={`relative h-6 w-11 rounded-full transition ${dark ? "bg-blue-600" : "bg-slate-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${dark ? "left-6" : "left-1"}`} /></span></button>;
}
