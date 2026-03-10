"use client";

import Link from "next/link";

import { formatDateTime, formatMoney } from "@/lib/format";
import type { Sale } from "@/lib/types";

type PosReceiptProps = {
  sale: Sale;
};

export function PosReceipt({ sale }: PosReceiptProps) {
  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-start px-4 py-8">
      {/* Printable receipt */}
      <div className="pos-receipt-print w-full max-w-sm">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-6 shadow-[var(--shadow-soft)]">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
              FarmAlmacen
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
              {sale.warehouseName}
            </p>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">
              {formatDateTime(sale.createdAt)}
            </p>
          </div>

          <hr className="my-4 border-dashed border-[var(--border)]" />

          <div className="space-y-2">
            {sale.items.map((item, index) => (
              <div key={index} className="flex items-start justify-between gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="text-[var(--foreground)]">{item.productName}</p>
                  <p className="text-xs text-[var(--ink-soft)]">
                    {item.quantity} x {formatMoney(item.price)}
                  </p>
                </div>
                <span className="font-semibold text-[var(--foreground)]">
                  {formatMoney(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <hr className="my-4 border-dashed border-[var(--border)]" />

          <div className="space-y-1">
            <div className="flex items-center justify-between text-base font-bold text-[var(--foreground)]">
              <span>TOTAL</span>
              <span>{formatMoney(sale.total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-[var(--ink-soft)]">
              <span>Efectivo</span>
              <span>{formatMoney(sale.cashReceived)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold text-[var(--success)]">
              <span>Cambio</span>
              <span>{formatMoney(sale.change)}</span>
            </div>
          </div>

          <hr className="my-4 border-dashed border-[var(--border)]" />

          <div className="text-center text-xs text-[var(--ink-soft)]">
            <p>Venta: {sale.id}</p>
            <p>Cajero: {sale.performedByName}</p>
          </div>
        </div>
      </div>

      {/* Actions (not printed) */}
      <div className="no-print mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="action-btn action-btn-primary"
        >
          Imprimir
        </button>
        <Link
          href={`/pos?warehouseId=${sale.warehouseId}`}
          className="action-btn action-btn-soft"
        >
          Nueva venta
        </Link>
        <Link href="/ventas" className="action-btn action-btn-soft">
          Ver historial
        </Link>
      </div>
    </div>
  );
}
