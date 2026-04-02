"use client";

import { useEffect } from "react";
import type { Order } from "@/lib/types";

type Props = {
  order: Order;
  type: "kitchen" | "bill";
  onClose: () => void;
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function line(char = "─", width = 36) { return char.repeat(width); }

export function RestaurantTicket({ order, type, onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function onAfterPrint() { onClose(); }
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, [onClose]);

  const isKitchen = type === "kitchen";
  const title = isKitchen ? "COMANDA - COCINA" : "CUENTA";

  return (
    <>
      {/* Screen overlay */}
      <div className="no-print wizard-overlay fixed inset-0 z-70 flex items-center justify-center p-4">
        <div className="wizard-panel w-full max-w-xs rounded-2xl border border-[#1e2433] shadow-2xl" style={{ background: "#13161d" }}>
          <div className="p-5 text-center">
            <div className="text-4xl mb-3">{isKitchen ? "👨‍🍳" : "🧾"}</div>
            <h2 className="font-semibold text-white">
              {isKitchen ? "Comanda enviada" : "Cuenta generada"}
            </h2>
            <p className="mt-1 text-sm text-[#6b7a94]">
              Folio #{order.folio} · Mesa {order.tableNumber}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => window.print()}
                className="action-btn action-btn-primary flex-1 justify-center text-sm"
              >
                🖨️ Imprimir
              </button>
              <button onClick={onClose} className="action-btn action-btn-soft flex-1 justify-center text-sm">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Print-only ticket */}
      <div className="restaurant-ticket-print" aria-hidden="true">
        <div style={{ fontFamily: "Courier New, monospace", fontSize: 11, width: "80mm", color: "#000" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 16, fontWeight: "bold", letterSpacing: "0.2em" }}>RestaurantOS</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>{title}</div>
          </div>

          <div>{line()}</div>

          {/* Info */}
          <div style={{ marginTop: 4, fontSize: 10 }}>
            <div><b>Mesa:</b> {order.tableNumber}{order.tableName ? ` (${order.tableName})` : ""}</div>
            <div><b>Folio:</b> #{order.folio}</div>
            <div><b>Fecha:</b> {fmtDate(order.createdAt)}</div>
            <div><b>Mesero:</b> {order.openedByName}</div>
            <div><b>Comensales:</b> {order.guestCount}</div>
            {order.notes && <div><b>Nota:</b> {order.notes}</div>}
          </div>

          <div style={{ marginTop: 4 }}>{line()}</div>

          {/* Items */}
          <div style={{ marginTop: 4 }}>
            {(isKitchen
              ? order.items.filter((i) => i.sentAt && (new Date(i.sentAt).getTime() > Date.now() - 5000) || !i.sentAt)
              : order.items
            ).map((item, idx) => (
              <div key={item.id} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: "bold" }}>{idx + 1}. {item.name}</span>
                  {!isKitchen && <span>{fmt(item.unitPrice * item.quantity)}</span>}
                </div>
                <div style={{ paddingLeft: 12, fontSize: 10 }}>
                  {item.quantity} x {isKitchen ? "" : fmt(item.unitPrice)}
                  {item.notes && <div style={{ fontStyle: "italic" }}>  → {item.notes}</div>}
                </div>
              </div>
            ))}
          </div>

          {!isKitchen && (
            <>
              <div>{line()}</div>
              <div style={{ marginTop: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 14 }}>
                  <span>TOTAL</span>
                  <span>{fmt(order.total)}</span>
                </div>
                {order.cashReceived && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10 }}>
                      <span>Recibido:</span><span>{fmt(order.cashReceived)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                      <span>Cambio:</span><span>{fmt(order.change ?? 0)}</span>
                    </div>
                  </>
                )}
                {order.paymentMethod && (
                  <div style={{ marginTop: 4, fontSize: 10 }}>
                    Forma de pago: {order.paymentMethod === "cash" ? "Efectivo" : order.paymentMethod === "card" ? "Tarjeta" : "Mixto"}
                  </div>
                )}
              </div>
            </>
          )}

          <div style={{ marginTop: 4 }}>{line()}</div>
          <div style={{ marginTop: 4, textAlign: "center", fontSize: 10 }}>
            {isKitchen
              ? `Enviado: ${new Date().toLocaleTimeString("es-MX")}`
              : "¡Gracias por su visita!\nVuelva pronto."
            }
          </div>
        </div>
      </div>
    </>
  );
}
