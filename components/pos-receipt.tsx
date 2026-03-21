"use client";

import Link from "next/link";

import { formatMoney } from "@/lib/format";
import type { Sale } from "@/lib/types";

type PosReceiptProps = {
  sale: Sale;
};

function pad(str: string, width: number, right = false): string {
  if (right) return str.slice(0, width).padStart(width);
  return str.slice(0, width).padEnd(width);
}

function formatReceiptLine(label: string, value: string, width = 32): string {
  const available = width - value.length;
  const truncatedLabel = label.slice(0, Math.max(1, available));
  return truncatedLabel.padEnd(available) + value;
}

export function PosReceipt({ sale }: PosReceiptProps) {
  const isCortesia = sale.saleType === "cortesia";

  const dateObj = new Date(sale.createdAt);
  const dateStr = dateObj.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = dateObj.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-start px-4 py-8">
      {/* ── Thermal-compatible receipt ── */}
      <div className="pos-receipt-print w-full max-w-[340px]">

        {/* Screen view wrapper */}
        <div className="receipt-screen rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)] overflow-hidden">

          {/* Header */}
          <div className="receipt-header bg-[color:rgba(31,99,85,0.06)] px-5 pt-5 pb-4 text-center border-b border-dashed border-[var(--border)]">
            <p className="receipt-brand text-xs font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
              FarmAlmacen
            </p>
            <p className="receipt-warehouse mt-0.5 text-sm font-semibold text-[var(--foreground)]">
              {sale.warehouseName}
            </p>
            {isCortesia ? (
              <div className="mt-2 inline-block rounded-full bg-[color:rgba(217,45,32,0.12)] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--danger)]">
                CORTESIA / SIN COBRO
              </div>
            ) : null}
            <p className="receipt-date mt-1.5 text-[11px] text-[var(--ink-soft)]">
              {dateStr} {timeStr}
            </p>
            <p className="receipt-folio text-[10px] text-[var(--ink-soft)] mt-0.5">
              Folio: {sale.id.slice(-10).toUpperCase()}
            </p>
          </div>

          {/* Items */}
          <div className="receipt-items px-5 py-4">
            <p className="receipt-section-label mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
              Articulos
            </p>
            <div className="space-y-2">
              {sale.items.map((item, index) => (
                <div key={index} className="receipt-item">
                  <div className="flex items-start justify-between gap-1">
                    <p className="flex-1 text-[13px] font-medium text-[var(--foreground)] leading-tight">
                      {item.productName}
                    </p>
                    <p className="receipt-item-subtotal text-[13px] font-semibold text-[var(--foreground)] tabular-nums">
                      {formatMoney(item.subtotal)}
                    </p>
                  </div>
                  <p className="text-[11px] text-[var(--ink-soft)] tabular-nums">
                    {item.quantity} x {formatMoney(item.price)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="receipt-totals border-t border-dashed border-[var(--border)] px-5 py-4 space-y-1.5">
            <div className="flex items-center justify-between text-[13px] text-[var(--ink-soft)]">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatMoney(sale.total)}</span>
            </div>

            {!isCortesia ? (
              <>
                <div className="flex items-center justify-between text-[13px] text-[var(--ink-soft)]">
                  <span>Efectivo</span>
                  <span className="tabular-nums">{formatMoney(sale.cashReceived)}</span>
                </div>
                <div className="receipt-total flex items-center justify-between border-t border-[var(--border)] pt-2 text-base font-bold text-[var(--foreground)]">
                  <span>TOTAL</span>
                  <span className="tabular-nums">{formatMoney(sale.total)}</span>
                </div>
                {sale.change > 0 ? (
                  <div className="flex items-center justify-between rounded-lg bg-[color:rgba(15,157,114,0.08)] px-2 py-1.5 text-[13px] font-semibold text-[var(--success)]">
                    <span>Cambio</span>
                    <span className="tabular-nums">{formatMoney(sale.change)}</span>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="receipt-total flex items-center justify-between border-t border-[var(--border)] pt-2 text-base font-bold text-[var(--danger)]">
                <span>CORTESIA</span>
                <span className="tabular-nums">{formatMoney(sale.total)}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="receipt-footer border-t border-dashed border-[var(--border)] px-5 py-3 text-center text-[11px] text-[var(--ink-soft)] space-y-0.5">
            <p>Cajero: {sale.performedByName}</p>
            {isCortesia && sale.authorizedByName ? (
              <p className="text-[var(--danger)]">
                Autorizo: {sale.authorizedByName}
              </p>
            ) : null}
            <p className="text-[10px]">Folio: {sale.id}</p>
            <p className="mt-1 font-medium text-[var(--foreground)]">
              ¡Gracias por su preferencia!
            </p>
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
          Imprimir ticket
        </button>
        <Link
          href={`/pos?warehouseId=${sale.warehouseId}${sale.cashRegisterSessionId ? `&sessionId=${sale.cashRegisterSessionId}` : ""}`}
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

// ─── Thermal print helpers (exported for pure print pages if needed) ──────────

export function thermalLines(sale: Sale): string[] {
  const isCortesia = sale.saleType === "cortesia";
  const W = 32;
  const lines: string[] = [];
  const center = (s: string) => s.slice(0, W).padStart(Math.floor((W + s.length) / 2)).padEnd(W);
  const sep = "-".repeat(W);
  const dashed = "=".repeat(W);

  lines.push(center("FARMALMACEN"));
  lines.push(center(sale.warehouseName));
  if (isCortesia) lines.push(center("** CORTESIA / SIN COBRO **"));
  lines.push(center(new Date(sale.createdAt).toLocaleString("es-MX")));
  lines.push(`Folio: ${sale.id.slice(-10).toUpperCase()}`);
  lines.push(dashed);

  for (const item of sale.items) {
    lines.push(pad(item.productName, W));
    lines.push(
      formatReceiptLine(
        `  ${item.quantity} x ${formatMoney(item.price)}`,
        formatMoney(item.subtotal),
        W,
      ),
    );
  }

  lines.push(sep);
  lines.push(formatReceiptLine("TOTAL", formatMoney(sale.total), W));
  if (!isCortesia) {
    lines.push(formatReceiptLine("Efectivo", formatMoney(sale.cashReceived), W));
    if (sale.change > 0) {
      lines.push(formatReceiptLine("Cambio", formatMoney(sale.change), W));
    }
  }
  lines.push(dashed);
  lines.push(`Cajero: ${sale.performedByName}`);
  if (isCortesia && sale.authorizedByName) {
    lines.push(`Autorizo: ${sale.authorizedByName}`);
  }
  lines.push(center("¡Gracias por su preferencia!"));

  return lines;
}
