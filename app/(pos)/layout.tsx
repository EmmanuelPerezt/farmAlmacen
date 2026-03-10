import Link from "next/link";

import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

type PosLayoutProps = {
  children: React.ReactNode;
};

export default async function PosLayout({ children }: PosLayoutProps) {
  const session = await requireSession();

  return (
    <div className="flex min-h-screen flex-col text-[var(--foreground)]">
      <header className="sticky top-0 z-30 border-b border-[color:rgba(148,163,184,0.28)] bg-[color:rgba(248,252,255,0.82)] px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              FarmAlmacen POS
            </p>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Terminal de venta
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--ink-soft)]">{session.displayName}</span>
            <Link href="/dashboard" className="action-btn action-btn-soft text-xs">
              Volver al panel
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
