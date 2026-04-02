"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { Session } from "@/lib/types";

type Props = { session: Session; children: React.ReactNode };

const NAV = [
  {
    href: "/mesas",
    label: "Mesas",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    role: null,
  },
  {
    href: "/menu",
    label: "Menú",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    ),
    role: null,
  },
  {
    href: "/historial",
    label: "Historial",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>
      </svg>
    ),
    role: null,
  },
  {
    href: "/configuracion",
    label: "Configurar",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
    role: "admin" as const,
  },
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function useTime() {
  const [time, setTime] = useState("");
  const [day, setDay] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false }));
      setDay(now.toLocaleDateString("es-MX", { weekday: "long" }));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);
  return { time, day };
}

export function RestaurantShell({ session, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { time, day } = useTime();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const filteredNav = NAV.filter((n) => !n.role || n.role === session.role);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out"
        style={{
          width: collapsed ? "64px" : "220px",
          background: "#13161d",
          borderRight: "1px solid #1e2433",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[#1e2433]">
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl">🍽️</span>
              <span className="text-sm font-bold text-white tracking-tight truncate">
                Restaurant<span className="text-amber-400">OS</span>
              </span>
            </div>
          )}
          {collapsed && <span className="text-xl mx-auto">🍽️</span>}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex-shrink-0 rounded-lg p-1.5 text-[#6b7a94] hover:text-white hover:bg-white/5 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed
                ? <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
              }
            </svg>
          </button>
        </div>

        {/* Time */}
        {!collapsed && (
          <div className="px-4 py-4 border-b border-[#1e2433]">
            <div className="text-2xl font-bold tabular-nums text-white leading-none">{time}</div>
            <div className="mt-0.5 text-xs text-[#6b7a94] capitalize">{day}</div>
          </div>
        )}
        {collapsed && (
          <div className="py-3 text-center border-b border-[#1e2433]">
            <div className="text-xs font-bold tabular-nums text-amber-400 leading-none">{time}</div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={[
                  "flex items-center gap-3 py-2.5 rounded-lg mx-2 text-sm font-medium transition-all",
                  collapsed ? "justify-center px-0" : "px-4",
                  isActive
                    ? "bg-amber-500/10 text-amber-400 border-l-2 border-amber-400 rounded-l-none"
                    : "text-[#6b7a94] hover:text-white hover:bg-white/5",
                ].join(" ")}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="border-t border-[#1e2433] p-3">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
                {getInitials(session.displayName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-white">{session.displayName}</div>
                <div className="text-[10px] text-[#6b7a94] capitalize">{session.role}</div>
              </div>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="rounded-lg p-1.5 text-[#6b7a94] hover:text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="mx-auto flex rounded-lg p-1.5 text-[#6b7a94] hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
