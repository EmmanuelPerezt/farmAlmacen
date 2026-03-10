import Link from "next/link";

import { NoticeBanner } from "@/components/notice-banner";
import { SectionCard } from "@/components/section-card";
import { formatDateTime, formatMoney } from "@/lib/format";
import { readSearchParam } from "@/lib/query";
import { listSales } from "@/lib/store";

type VentasPageProps = {
  searchParams?: Promise<{
    success?: string | string[];
    error?: string | string[];
  }>;
};

export default async function VentasPage({ searchParams }: VentasPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const success = readSearchParam(resolvedParams?.success);
  const error = readSearchParam(resolvedParams?.error);

  const sales = listSales();

  return (
    <div className="space-y-6">
      <NoticeBanner success={success} error={error} />
      <SectionCard
        title="Historial de ventas"
        description="Registro de todas las ventas realizadas desde el punto de venta."
      >
        {sales.length === 0 ? (
          <div className="panel-soft rounded-2xl border-dashed p-6 text-sm text-[var(--ink-soft)]">
            No hay ventas registradas todavia.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Mobile cards */}
            <div className="space-y-2 md:hidden">
              {sales.map((sale) => (
                <article
                  key={sale.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="rounded-full border border-[color:rgba(31,99,85,0.24)] bg-[color:rgba(31,99,85,0.1)] px-2 py-1 text-[0.68rem] font-semibold text-[var(--primary-strong)]">
                      {sale.id}
                    </span>
                    <span className="text-[0.68rem] text-[var(--ink-soft)]">
                      {formatDateTime(sale.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {formatMoney(sale.total)}
                    </p>
                    <p className="text-xs text-[var(--ink-soft)]">
                      {sale.itemCount} {sale.itemCount === 1 ? "articulo" : "articulos"}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <p className="text-[var(--ink-soft)]">{sale.warehouseName}</p>
                    <p className="text-[var(--ink-soft)]">{sale.performedByName}</p>
                  </div>
                  <div className="mt-2">
                    <Link
                      href={`/pos/recibo?saleId=${sale.id}`}
                      className="text-xs font-medium text-[var(--accent)] hover:underline"
                    >
                      Ver recibo
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-[660px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                    <th className="pb-2 pr-3">ID</th>
                    <th className="pb-2 pr-3">Fecha</th>
                    <th className="pb-2 pr-3">Almacen</th>
                    <th className="pb-2 pr-3">Articulos</th>
                    <th className="pb-2 pr-3">Total</th>
                    <th className="pb-2 pr-3">Cajero</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-b border-[var(--border)] align-top transition hover:bg-[var(--hover-tint)]"
                    >
                      <td className="py-2 pr-3 text-xs font-semibold text-[var(--foreground)]">
                        {sale.id}
                      </td>
                      <td className="py-2 pr-3 text-[var(--ink-soft)]">
                        {formatDateTime(sale.createdAt)}
                      </td>
                      <td className="py-2 pr-3 text-[var(--ink-soft)]">{sale.warehouseName}</td>
                      <td className="py-2 pr-3 font-semibold text-[var(--foreground)]">
                        {sale.itemCount}
                      </td>
                      <td className="py-2 pr-3 font-semibold text-[var(--foreground)]">
                        {formatMoney(sale.total)}
                      </td>
                      <td className="py-2 pr-3 text-[var(--ink-soft)]">{sale.performedByName}</td>
                      <td className="py-2">
                        <Link
                          href={`/pos/recibo?saleId=${sale.id}`}
                          className="text-xs font-medium text-[var(--accent)] hover:underline"
                        >
                          Ver recibo
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
