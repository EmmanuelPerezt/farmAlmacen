"use client";

import { useState } from "react";
import type { Order } from "@/lib/types";
import { RestaurantTicket } from "./restaurant-ticket";

type Props = { orders: Order[] };

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function timeDiff(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `Hace ${h}h ${m}m`;
  return `Hace ${m}m`;
}

export function OrderHistory({ orders }: Props) {
  const [selected, setSelected] = useState<Order | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "cancelled">("all");

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchSearch = !search || String(o.folio).includes(search) || String(o.tableNumber).includes(search) || o.openedByName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalRevenue = orders.filter((o) => o.status === "paid").reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.filter((o) => o.status === "paid").length;

  return (
    <div className="flex h-full" style={{ background: "#0d0f14" }}>
      {/* List */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="border-b border-[#1e2433] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-white">Historial de Órdenes</h1>
              <p className="mt-0.5 text-xs text-[#6b7a94]">
                {totalOrders} cobradas hoy · {fmt(totalRevenue)} en ventas
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por folio, mesa o mesero..."
              className="form-input w-72 text-sm"
            />
            <div className="flex gap-1 rounded-xl border border-[#1e2433] p-1">
              {(["all", "paid", "cancelled"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={[
                    "rounded-lg px-3 py-1 text-xs font-medium transition-all",
                    statusFilter === s ? "bg-amber-500/15 text-amber-400" : "text-[#6b7a94] hover:text-white",
                  ].join(" ")}
                >
                  {s === "all" ? "Todas" : s === "paid" ? "✓ Cobradas" : "✗ Canceladas"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e2433] text-xs font-semibold uppercase tracking-wider text-[#6b7a94]">
                <th className="px-6 py-3 text-left">Folio</th>
                <th className="px-4 py-3 text-left">Mesa</th>
                <th className="px-4 py-3 text-left">Mesero</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Pago</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelected(selected?.id === order.id ? null : order)}
                  className={[
                    "border-b border-[#1e2433] cursor-pointer transition-colors",
                    selected?.id === order.id ? "bg-amber-500/5" : "hover:bg-white/3",
                  ].join(" ")}
                >
                  <td className="px-6 py-3 font-mono text-amber-400 font-bold">#{order.folio}</td>
                  <td className="px-4 py-3 text-white">Mesa {order.tableNumber}{order.tableName ? ` (${order.tableName})` : ""}</td>
                  <td className="px-4 py-3 text-[#6b7a94]">{order.openedByName}</td>
                  <td className="px-4 py-3 text-right font-bold text-white">{fmt(order.total)}</td>
                  <td className="px-4 py-3 text-center text-xs text-[#6b7a94]">
                    {order.paymentMethod === "cash" ? "💵" : order.paymentMethod === "card" ? "💳" : order.paymentMethod === "mixed" ? "🔀" : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={[
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      order.status === "paid" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400",
                    ].join(" ")}>
                      {order.status === "paid" ? "PAGADA" : "CANCELADA"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#6b7a94]">{fmtDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); setPrintOrder(order); }}
                      className="rounded-lg p-1.5 text-[#6b7a94] hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                      title="Reimprimir"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                        <rect x="6" y="14" width="12" height="8"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-[#6b7a94]">
                    <div className="text-4xl mb-3">📋</div>
                    <div>No hay órdenes que mostrar</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-72 flex-shrink-0 border-l border-[#1e2433] flex flex-col" style={{ background: "#13161d" }}>
          <div className="flex items-center justify-between border-b border-[#1e2433] px-4 py-3">
            <div>
              <div className="font-semibold text-white">Orden #{selected.folio}</div>
              <div className="text-xs text-[#6b7a94]">{timeDiff(selected.createdAt)}</div>
            </div>
            <button onClick={() => setSelected(null)} className="rounded-lg p-1 text-[#6b7a94] hover:text-white hover:bg-white/5 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {selected.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between text-sm">
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium truncate">{item.name}</div>
                  {item.notes && <div className="text-[10px] text-[#6b7a94] italic">{item.notes}</div>}
                </div>
                <div className="ml-2 text-right flex-shrink-0">
                  <div className="text-[#6b7a94] text-xs">{item.quantity}x {fmt(item.unitPrice)}</div>
                  <div className="text-white font-medium">{fmt(item.unitPrice * item.quantity)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#1e2433] p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-[#6b7a94]">Total</span>
              <span className="font-bold text-amber-400">{fmt(selected.total)}</span>
            </div>
            {selected.cashReceived && (
              <>
                <div className="flex justify-between text-xs text-[#6b7a94]">
                  <span>Recibido</span><span>{fmt(selected.cashReceived)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#6b7a94]">
                  <span>Cambio</span><span>{fmt(selected.change ?? 0)}</span>
                </div>
              </>
            )}
            <button onClick={() => setPrintOrder(selected)} className="action-btn action-btn-soft w-full justify-center text-xs mt-2">
              🖨️ Reimprimir ticket
            </button>
          </div>
        </div>
      )}

      {/* Print */}
      {printOrder && (
        <RestaurantTicket
          order={printOrder}
          type="bill"
          onClose={() => setPrintOrder(null)}
        />
      )}
    </div>
  );
}
