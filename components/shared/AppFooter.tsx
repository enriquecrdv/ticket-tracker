import { ShieldCheck } from "lucide-react";

export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">
              Portal de soporte comercial
            </p>
            <p className="text-sm">Gestión segura y centralizada de folios.</p>
          </div>
        </div>

        <div className="text-sm md:text-right">
          <p>© {year} Enrique Cordova. Todos los derechos reservados.</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Plataforma de uso interno · v0.1.0
          </p>
        </div>
      </div>
    </footer>
  );
}
