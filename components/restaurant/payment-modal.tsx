"use client";

import { useState } from "react";
import type { Order } from "@/lib/types";

type Props = {
  order: Order;
  onClose: () => void;
  onPaid: (order: Order) => void;
};

type Method = "cash" | "card" | "mixed";

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 }).format(n);
}

export function PaymentModal({ order, onClose, onPaid }: Props) {
  const [method, setMethod] = useState<Method>("cash");
  const [cashInput, setCashInput] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const cashReceived = parseFloat(cashInput) || 0;
  const change = Math.max(0, cashReceived - order.total);
  const cashValid = method !== "cash" || cashReceived >= order.total;

  const QUICK_AMOUNTS = [order.total, Math.ceil(order.total / 50) * 50, Math.ceil(order.total / 100) * 100, Math.ceil(order.total / 500) * 500].filter((v, i, arr) => arr.indexOf(v) === i && v >= order.total).slice(0, 4);

  async function handlePay() {
    if (!cashValid) { setError("El efectivo recibido no cubre el total"); return; }
    setPaying(true);
    setError("");
    try {
      const res = await fetch(`/api/restaurant/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pay",
          paymentMethod: method,
          cashReceived: method === "cash" || method === "mixed" ? cashReceived : order.total,
        }),
      });
      const data = await res.json();
      if (data.order) {
        onPaid(data.order);
      } else {
        setError(data.error ?? "Error al procesar pago");
      }
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="wizard-overlay fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="wizard-panel w-full max-w-sm rounded-2xl border border-[#1e2433] shadow-2xl" style={{ background: "#13161d" }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e2433] px-5 py-4">
          <div>
            <h2 className="font-semibold text-white">Cobrar orden</h2>
            <p className="text-xs text-[#6b7a94]">Mesa {order.tableNumber} · Folio #{order.folio}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#6b7a94] hover:text-white hover:bg-white/5 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Total */}
          <div className="rounded-xl bg-amber-500/8 border border-amber-500/15 p-4 text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-amber-500/70">Total a cobrar</div>
            <div className="mt-1 text-4xl font-bold text-amber-400">{fmt(order.total)}</div>
          </div>

          {/* Payment method */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6b7a94]">Método de pago</div>
            <div className="grid grid-cols-3 gap-2">
              {(["cash", "card", "mixed"] as Method[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={[
                    "rounded-xl border py-3 text-xs font-semibold transition-all",
                    method === m
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                      : "border-[#1e2433] text-[#6b7a94] hover:text-white hover:border-[#353c50]",
                  ].join(" ")}
                >
                  {m === "cash" ? "💵 Efectivo" : m === "card" ? "💳 Tarjeta" : "🔀 Mixto"}
                </button>
              ))}
            </div>
          </div>

          {/* Cash input */}
          {(method === "cash" || method === "mixed") && (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6b7a94]">Efectivo recibido</div>
              <input
                type="number"
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
                placeholder="0.00"
                min={0}
                step={0.01}
                className="form-input text-xl font-bold text-center"
                autoFocus
              />
              {/* Quick amounts */}
              <div className="mt-2 flex gap-1.5">
                {QUICK_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCashInput(String(amount))}
                    className="flex-1 rounded-lg border border-[#1e2433] bg-[#1a1e28] py-1.5 text-xs font-medium text-[#6b7a94] hover:text-white hover:border-[#353c50] transition-colors"
                  >
                    {fmt(amount)}
                  </button>
                ))}
              </div>
              {/* Change */}
              {cashReceived > 0 && cashReceived >= order.total && (
                <div className="mt-3 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm text-green-400 font-medium">Cambio</span>
                  <span className="text-lg font-bold text-green-400">{fmt(change)}</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{error}</div>
          )}

          <button
            onClick={handlePay}
            disabled={paying || !cashValid}
            className="action-btn action-btn-success w-full justify-center py-3 text-sm"
          >
            {paying ? "Procesando..." : `✓ Confirmar pago ${fmt(order.total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
