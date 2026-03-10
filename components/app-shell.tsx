"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import type { Session } from "@/lib/types";

type AppShellProps = {
  user: Session;
  children: React.ReactNode;
};

type IconProps = {
  className?: string;
};

function DashboardIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="3" width="8" height="5" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="10" width="8" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function MovementIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M4 7h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m13 4 4 3-4 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 17H7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m11 14-4 3 4 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProductIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 3 4 7.5 12 12l8-4.5L12 3Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 7.5V16.5L12 21V12" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 7.5V16.5L12 21" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function WarehouseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 13h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 17h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PosIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 9h16" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 9v11" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

function SalesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 12h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M19.4 13.5a1 1 0 0 0 .2 1.1l.1.1a1.2 1.2 0 0 1 0 1.7l-1 1a1.2 1.2 0 0 1-1.7 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V18a1.2 1.2 0 0 1-1.2 1.2h-1.4A1.2 1.2 0 0 1 10.4 18v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1.2 1.2 0 0 1-1.7 0l-1-1a1.2 1.2 0 0 1 0-1.7l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H5A1.2 1.2 0 0 1 3.8 11.6V10.4A1.2 1.2 0 0 1 5 9.2h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1.2 1.2 0 0 1 0-1.7l1-1a1.2 1.2 0 0 1 1.7 0l.1.1a1 1 0 0 0 1.1.2h.1a1 1 0 0 0 .6-.9V4A1.2 1.2 0 0 1 11.6 2.8h1.2A1.2 1.2 0 0 1 14 4v.2a1 1 0 0 0 .6.9h.1a1 1 0 0 0 1.1-.2l.1-.1a1.2 1.2 0 0 1 1.7 0l1 1a1.2 1.2 0 0 1 0 1.7l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6h.2A1.2 1.2 0 0 1 20.6 10.4v1.2a1.2 1.2 0 0 1-1.2 1.2h-.2a1 1 0 0 0-.9.6Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function MoonIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SunIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

type NavItem = {
  href: string;
  label: string;
  icon: (props: IconProps) => React.ReactNode;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/productos", label: "Productos", icon: ProductIcon },
  { href: "/pos", label: "POS", icon: PosIcon },
  { href: "/ventas", label: "Ventas", icon: SalesIcon },
  { href: "/movimientos", label: "Movimientos", icon: MovementIcon },
  { href: "/almacenes", label: "Almacenes", icon: WarehouseIcon },
  { href: "/configuracion", label: "Config", icon: SettingsIcon },
];

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/movimientos")) return "Movimientos";
  if (pathname.startsWith("/productos")) return "Productos";
  if (pathname.startsWith("/almacenes")) return "Almacenes";
  if (pathname.startsWith("/configuracion")) return "Configuracion";
  if (pathname.startsWith("/pos")) return "Punto de Venta";
  if (pathname.startsWith("/ventas")) return "Ventas";
  return "FarmAlmacen";
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("farmalmacen-theme", next);
  };

  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

  return (
    <div className="relative min-h-screen text-[var(--foreground)]">
      <div
        className={`fixed inset-0 z-40 hidden bg-slate-950/45 transition-opacity md:block lg:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 hidden w-72 flex-col border-r border-[var(--border)] bg-[var(--surface-glass)] px-4 py-4 backdrop-blur transition-transform duration-300 md:flex lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              FarmAlmacen
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">Panel Operativo</p>
          </div>
          <button type="button" className="action-btn action-btn-soft lg:hidden" onClick={() => setSidebarOpen(false)}>
            Cerrar
          </button>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                  active
                    ? "border-[color:rgba(31,99,85,0.3)] bg-[color:rgba(31,99,85,0.11)] text-[var(--primary-strong)]"
                    : "border-transparent text-[var(--ink-soft)] hover:border-[var(--border)] hover:bg-[var(--surface)]"
                }`}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border-light)] bg-[var(--surface)]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink-soft)]">
          Datos en memoria para este MVP.
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface-glass)] px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="action-btn action-btn-soft hidden md:inline-flex lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                Menu
              </button>
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.15em] text-[var(--accent)]">Modulo</p>
                <h1 className="text-xl font-semibold text-[var(--foreground)]">{pageTitle}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)] transition hover:border-[color:rgba(31,99,85,0.34)]"
                aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              >
                {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
              </button>
              <div className="relative">
              <button
                type="button"
                className="flex min-w-44 items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left text-sm transition hover:border-[color:rgba(31,99,85,0.34)]"
                onClick={() => setMenuOpen((value) => !value)}
              >
                <span>
                  <span className="block font-semibold text-[var(--foreground)]">{user.displayName}</span>
                  <span className="block text-[0.72rem] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                    {user.role}
                  </span>
                </span>
                <span className={`text-xs text-[var(--ink-soft)] transition-transform ${menuOpen ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>

              <div
                className={`absolute right-0 mt-2 w-64 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_18px_30px_-22px_rgba(15,23,42,0.65)] transition ${
                  menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">Sesion activa</p>
                <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">@{user.username}</p>
                <form action="/api/auth/logout" method="post" className="mt-3">
                  <button type="submit" className="action-btn action-btn-danger w-full">
                    Cerrar sesion
                  </button>
                </form>
              </div>
            </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-5 pb-24 md:pb-5 lg:px-6 lg:py-6 lg:pb-6">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface-glass)] px-2 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navItems.slice(0, 5).map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[0.67rem] font-medium transition ${
                  active
                    ? "bg-[color:rgba(31,99,85,0.11)] text-[var(--primary-strong)]"
                    : "text-[var(--ink-soft)] hover:bg-[var(--hover-tint)]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
