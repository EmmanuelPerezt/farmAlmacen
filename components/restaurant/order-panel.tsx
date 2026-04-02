"use client";

import { useState, useEffect, useRef } from "react";
import type { TableWithStatus, Order, MenuItem, MenuCategory } from "@/lib/types";
import { PaymentModal } from "./payment-modal";
import { RestaurantTicket } from "./restaurant-ticket";

type Props = {
  table: TableWithStatus;
  order: Order | null;
  loading: boolean;
  onClose: () => void;
  onOrderUpdate: (order: Order) => void;
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 }).format(n);
}

export function OrderPanel({ table, order, loading, onClose, onOrderUpdate }: Props) {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(order);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [menuSearch, setMenuSearch] = useState("");
  const [openingOrder, setOpeningOrder] = useState(false);
  const [guestCount, setGuestCount] = useState(table.activeOrder?.guestCount ?? 2);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showTicket, setShowTicket] = useState<"kitchen" | "bill" | null>(null);
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setCurrentOrder(order); }, [order]);

  useEffect(() => {
    fetch("/api/restaurant/menu/categories").then((r) => r.json()).then((d) => {
      setCategories(d.categories ?? []);
      if (d.categories?.length) setActiveCategory(d.categories[0].id);
    });
    fetch("/api/restaurant/menu/items").then((r) => r.json()).then((d) => {
      setMenuItems(d.items ?? []);
    });
  }, []);

  async function openOrder() {
    setOpeningOrder(true);
    try {
      const res = await fetch("/api/restaurant/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: table.id, guestCount, notes }),
      });
      const data = await res.json();
      if (data.order) {
        setCurrentOrder(data.order);
        onOrderUpdate(data.order);
      }
    } finally {
      setOpeningOrder(false);
    }
  }

  async function addItem(item: MenuItem) {
    if (!currentOrder) return;
    const note = itemNotes[item.id] ?? "";
    const res = await fetch(`/api/restaurant/orders/${currentOrder.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menuItemId: item.id, quantity: 1, notes: note }),
    });
    const data = await res.json();
    if (data.order) {
      setCurrentOrder(data.order);
      onOrderUpdate(data.order);
    }
  }

  async function changeQty(itemId: string, delta: number) {
    if (!currentOrder) return;
    const orderItem = currentOrder.items.find((i) => i.id === itemId);
    if (!orderItem) return;
    const newQty = orderItem.quantity + delta;
    const res = await fetch(`/api/restaurant/orders/${currentOrder.id}/items/${itemId}`, {
      method: delta > 0 ? "PUT" : newQty <= 0 ? "DELETE" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: newQty <= 0 ? undefined : JSON.stringify({ quantity: newQty }),
    });
    const data = await res.json();
    if (data.order) {
      setCurrentOrder(data.order);
      onOrderUpdate(data.order);
    }
  }

  async function sendToKitchen() {
    if (!currentOrder) return;
    setSending(true);
    try {
      const res = await fetch(`/api/restaurant/orders/${currentOrder.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send" }),
      });
      const data = await res.json();
      if (data.order) {
        setCurrentOrder(data.order);
        onOrderUpdate(data.order);
        setShowTicket("kitchen");
      }
    } finally {
      setSending(false);
    }
  }

  async function billOrder() {
    if (!currentOrder) return;
    const res = await fetch(`/api/restaurant/orders/${currentOrder.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bill" }),
    });
    const data = await res.json();
    if (data.order) {
      setCurrentOrder(data.order);
      onOrderUpdate(data.order);
      setShowTicket("bill");
    }
  }

  async function handlePaymentComplete(order: Order) {
    setCurrentOrder(order);
    onOrderUpdate(order);
    setShowPayment(false);
    setShowTicket("bill");
  }

  const filteredItems = menuItems.filter((item) => {
    if (!item.available) return false;
    const matchesCategory = !activeCategory || item.categoryId === activeCategory;
    const matchesSearch = !menuSearch || item.name.toLowerCase().includes(menuSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const unsentItems = currentOrder?.items.filter((i) => !i.sentAt) ?? [];
  const hasItems = (currentOrder?.items.length ?? 0) > 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="slide-in-right fixed right-0 top-0 z-50 flex h-full flex-col shadow-2xl"
        style={{ width: 680, background: "#13161d", borderLeft: "1px solid #1e2433" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e2433] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-lg font-bold text-amber-400 border border-amber-500/20">
              {table.number}
            </div>
            <div>
              <div className="font-semibold text-white">
                Mesa {table.number}{table.name ? ` · ${table.name}` : ""}
              </div>
              <div className="text-xs text-[#6b7a94]">
                {table.sectionName ?? "Sin sección"} · {table.seats} lugares
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentOrder && (
              <>
                <button
                  onClick={sendToKitchen}
                  disabled={sending || unsentItems.length === 0}
                  className="action-btn action-btn-soft text-xs"
                  title="Enviar pedido a cocina"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.9 12.22a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 3.81 1.5h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  Cocina {unsentItems.length > 0 && <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] text-black font-bold">{unsentItems.length}</span>}
                </button>
              </>
            )}
            <button onClick={onClose} className="rounded-lg p-2 text-[#6b7a94] hover:text-white hover:bg-white/5 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center text-[#6b7a94]">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 rounded-full border-2 border-amber-500/30 border-t-amber-500 spin" />
              <span className="text-sm">Cargando...</span>
            </div>
          </div>
        ) : !currentOrder ? (
          /* Open order form */
          <div className="flex flex-1 flex-col items-center justify-center p-8">
            <div className="w-full max-w-sm">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#1e2433] bg-[#1a1e28] text-3xl">🪑</div>
                <h2 className="text-lg font-semibold text-white">Mesa disponible</h2>
                <p className="mt-1 text-sm text-[#6b7a94]">Abre una nueva orden para comenzar</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#f1f0ec]">Número de comensales</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setGuestCount((g) => Math.max(1, g - 1))} className="action-btn action-btn-soft h-10 w-10 justify-center">−</button>
                    <span className="flex-1 text-center text-xl font-bold text-white">{guestCount}</span>
                    <button onClick={() => setGuestCount((g) => Math.min(table.seats, g + 1))} className="action-btn action-btn-soft h-10 w-10 justify-center">+</button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#f1f0ec]">Nota (opcional)</label>
                  <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: cumpleaños, alergia a nueces..." className="form-input" />
                </div>
                <button onClick={openOrder} disabled={openingOrder} className="action-btn action-btn-primary w-full justify-center py-3">
                  {openingOrder ? "Abriendo..." : "Abrir orden"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Active order */
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Menu */}
            <div className="flex flex-1 flex-col border-r border-[#1e2433]">
              {/* Search */}
              <div className="p-3 border-b border-[#1e2433]">
                <input
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Buscar platillo..."
                  className="form-input text-sm"
                />
              </div>
              {/* Category tabs */}
              <div className="flex gap-1 overflow-x-auto p-2 border-b border-[#1e2433] scrollbar-hide">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.id); setMenuSearch(""); }}
                    className={[
                      "flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap",
                      activeCategory === cat.id ? "bg-amber-500/15 text-amber-400" : "text-[#6b7a94] hover:text-white hover:bg-white/5",
                    ].join(" ")}
                  >
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>
              {/* Items grid */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="grid grid-cols-2 gap-2">
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addItem(item)}
                      className="text-left rounded-xl border border-[#1e2433] bg-[#1a1e28] p-3 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
                    >
                      <div className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors leading-tight">{item.name}</div>
                      {item.description && <div className="mt-0.5 text-[10px] text-[#6b7a94] line-clamp-1">{item.description}</div>}
                      <div className="mt-2 text-sm font-bold text-amber-400">{fmt(item.price)}</div>
                    </button>
                  ))}
                  {filteredItems.length === 0 && (
                    <div className="col-span-2 py-8 text-center text-sm text-[#6b7a94]">Sin resultados</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Order */}
            <div className="flex w-64 flex-col">
              {/* Order header */}
              <div className="flex items-center justify-between border-b border-[#1e2433] px-4 py-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7a94]">Orden</div>
                  <div className="text-xs text-[#6b7a94]">{currentOrder.guestCount} comensal{currentOrder.guestCount !== 1 ? "es" : ""}</div>
                </div>
                <div className={[
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  currentOrder.status === "open" ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400",
                ].join(" ")}>
                  {currentOrder.status === "open" ? "ABIERTA" : "COBRAR"}
                </div>
              </div>

              {/* Items list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {!hasItems && (
                  <div className="py-6 text-center text-xs text-[#6b7a94]">
                    Selecciona platillos del menú
                  </div>
                )}
                {currentOrder.items.map((item) => (
                  <div key={item.id} className="rounded-lg border border-[#1e2433] bg-[#1a1e28] p-2.5">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-white leading-tight truncate">{item.name}</div>
                        <div className="text-[10px] text-amber-400 font-medium">{fmt(item.unitPrice)}</div>
                        {item.sentAt && <div className="mt-0.5 text-[9px] text-green-500">✓ Enviado</div>}
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-1">
                        <button onClick={() => changeQty(item.id, -1)} className="flex h-5 w-5 items-center justify-center rounded text-[#6b7a94] hover:text-red-400 hover:bg-red-400/10 text-xs transition-colors">−</button>
                        <span className="w-4 text-center text-xs font-bold text-white">{item.quantity}</span>
                        <button onClick={() => changeQty(item.id, 1)} className="flex h-5 w-5 items-center justify-center rounded text-[#6b7a94] hover:text-green-400 hover:bg-green-400/10 text-xs transition-colors">+</button>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <button
                        onClick={() => setEditingNote(editingNote === item.id ? null : item.id)}
                        className="text-[9px] text-[#6b7a94] hover:text-amber-400 transition-colors"
                      >
                        {item.notes ? `📝 ${item.notes}` : "+ nota"}
                      </button>
                      <span className="text-[10px] font-bold text-white">{fmt(item.unitPrice * item.quantity)}</span>
                    </div>
                    {editingNote === item.id && (
                      <input
                        className="mt-1.5 w-full rounded-md border border-[#252a38] bg-[#13161d] px-2 py-1 text-[10px] text-white placeholder-[#6b7a94]"
                        placeholder="Nota para cocina..."
                        defaultValue={item.notes}
                        onBlur={async (e) => {
                          const newNote = e.target.value;
                          if (newNote !== item.notes) {
                            await fetch(`/api/restaurant/orders/${currentOrder.id}/items/${item.id}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ notes: newNote }),
                            });
                          }
                          setEditingNote(null);
                        }}
                        autoFocus
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Totals + actions */}
              <div className="border-t border-[#1e2433] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6b7a94]">Total</span>
                  <span className="text-xl font-bold text-amber-400">{fmt(currentOrder.total)}</span>
                </div>

                {currentOrder.status === "open" && (
                  <>
                    {unsentItems.length > 0 && (
                      <button onClick={sendToKitchen} disabled={sending} className="action-btn action-btn-soft w-full justify-center text-xs">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="22 2 11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                        {sending ? "Enviando..." : `Enviar a cocina (${unsentItems.length})`}
                      </button>
                    )}
                    <button onClick={billOrder} disabled={!hasItems} className="action-btn action-btn-primary w-full justify-center text-sm py-2.5">
                      Solicitar cuenta
                    </button>
                  </>
                )}

                {currentOrder.status === "billed" && (
                  <button onClick={() => setShowPayment(true)} className="action-btn action-btn-success w-full justify-center text-sm py-2.5">
                    💳 Cobrar {fmt(currentOrder.total)}
                  </button>
                )}

                {(currentOrder.status === "open" || currentOrder.status === "billed") && currentOrder.folio && (
                  <button onClick={() => setShowTicket("bill")} className="action-btn action-btn-ghost w-full justify-center text-xs">
                    🖨️ Reimprimir cuenta
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment modal */}
      {showPayment && currentOrder && (
        <PaymentModal
          order={currentOrder}
          onClose={() => setShowPayment(false)}
          onPaid={handlePaymentComplete}
        />
      )}

      {/* Print ticket */}
      {showTicket && currentOrder && (
        <RestaurantTicket
          order={currentOrder}
          type={showTicket}
          onClose={() => setShowTicket(null)}
        />
      )}
    </>
  );
}
