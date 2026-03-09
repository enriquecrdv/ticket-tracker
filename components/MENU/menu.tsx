"use client";

import { useState } from "react";
import { LogOut, Plus, CheckSquare, User } from "lucide-react";
import "./menu.css";

export default function SidebarMenu() {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  const menuItems = [
    {
      icon: CheckSquare,
      label: "Ver Tickets",
      href: "/tickets",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Plus,
      label: "Levantar Ticket",
      href: "/tickets/new",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: User,
      label: "Mi Perfil",
      href: "/profile",
      color: "from-purple-500 to-pink-500",
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl border-r border-slate-700/50">
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-bold shadow-lg">
              SP
            </div>
            <div>
              <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                TicketHub
              </h1>
              <p className="text-xs text-slate-400">Gestor de Tickets</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <a
                key={index}
                href={item.href}
                className="group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:shadow-lg"
              >
                <div
                  className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-all duration-300 bg-linear-to-r ${item.color}`}
                />
                <div
                  className={`p-2.5 rounded-lg bg-linear-to-br ${item.color} shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110`}
                >
                  <Icon size={20} className="text-white" />
                </div>
                <span className="relative font-medium text-slate-200 group-hover:text-white">
                  {item.label}
                </span>
              </a>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="border-t border-slate-700/50 p-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 mb-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                Juan Doe
              </p>
              <p className="text-xs text-slate-400 truncate">
                juan@empresa.com
              </p>
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-linear-to-r from-red-600 to-rose-600 text-white font-medium hover:shadow-lg transition-all duration-300">
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700/50 z-40">
        <div className="flex justify-around items-center h-20 px-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="relative"
                onMouseEnter={() => setHoveredItem(index)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <a
                  href={item.href}
                  className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-300 ${
                    hoveredItem === index
                      ? `bg-linear-to-br ${item.color}`
                      : "text-slate-400"
                  }`}
                >
                  <Icon size={24} />
                  <span className="text-xs mt-1 font-medium">
                    {item.label.split(" ")[0]}
                  </span>
                </a>

                {/* Tooltip */}
                {hoveredItem === index && (
                  <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-lg border border-slate-700 mb-2">
                    {item.label}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Mobile Padding */}
      <div className="md:hidden pb-20" />
    </>
  );
}
