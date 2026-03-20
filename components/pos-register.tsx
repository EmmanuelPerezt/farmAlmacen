"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { QrScanner } from "@/components/qr-scanner";
import { formatMoney } from "@/lib/format";
import type { CashRegisterSession, Product, Warehouse } from "@/lib/types";

type ProductWithQty = Product & { qty: number };

type CartItem = {
  sku: number;
  name: string;
  price: number;
  quantity: number;
  maxQty: number;
};

type AdminUser = {
  id: string;
  username: string;
  displayName: string;
  role: string;
};

type SaleMode = "normal" | "cortesia";

type PosRegisterProps = {
  warehouses: Warehouse[];
  products: ProductWithQty[];
  activeWarehouseId?: string;
  activeSessionId?: string;
};

// ─── Apertura de Caja Modal ──────────────────────────────────────────────────

type AperturaModalProps = {
  warehouse: Warehouse;
  onConfirm: (sessionId: string) => void;
  onCancel: () => void;
};

function AperturaModal({ warehouse, onConfirm, onCancel }: AperturaModalProps) {
  const [openingBalance, setOpeningBalance] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    setTimeout(() => inputRef.current?.focus(), 50);
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onCancel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const balance = Number(openingBalance) || 0;
    if (balance < 0) {
      setError("El fondo inicial no puede ser negativo.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/cash-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "open",
          warehouseId: warehouse.id,
          openingBalance: balance,
        }),
      });
      const data = await res.json() as { session?: { id: string }; error?: string };
      if (!res.ok) {
        setError(data.error ?? "No fue posible abrir la caja.");
        return;
      }
      onConfirm(data.session!.id);
    } catch {
      setError("Error de conexion. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="wizard-overlay fixed inset-0 z-[120] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onCancel} aria-label="Cancelar" />
      <div
        className="wizard-panel relative z-10 w-full max-w-md overflow-hidden rounded-[1.35rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_40px_60px_-36px_rgba(15,23,42,0.78)] sm:rounded-[1.5rem]"
        role="dialog"
        aria-modal="true"
        aria-label="Apertura de caja"
      >
        <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="pill-label">Punto de Venta</p>
              <h3 className="mt-2 text-[1.35rem] leading-none text-[var(--foreground)]">
                Apertura de caja
              </h3>
            </div>
            <button type="button" className="action-btn action-btn-soft" onClick={onCancel}>
              Cancelar
            </button>
          </div>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Almacen: <span className="font-semibold text-[var(--foreground)]">{warehouse.name}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 sm:px-6">
          {error ? (
            <div className="mb-4 rounded-xl border border-[color:rgba(217,45,32,0.28)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger-text)]">
              {error}
            </div>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Fondo inicial de caja
            </span>
            <input
              ref={inputRef}
              type="number"
              min={0}
              step="0.01"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="form-input"
              placeholder="0.00"
            />
            <p className="mt-1 text-[11px] text-[var(--ink-soft)]">
              Ingresa el efectivo con el que inicia la caja. Puedes dejar en 0 si no hay fondo previo.
            </p>
          </label>

          <div className="mt-4 rounded-xl border border-[color:rgba(47,138,119,0.2)] bg-[color:rgba(47,138,119,0.06)] px-3 py-2 text-xs text-[var(--ink-soft)]">
            Este registro permite calcular el corte de caja al finalizar el turno.
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button type="button" className="action-btn action-btn-soft" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="action-btn action-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Abriendo..." : "Abrir caja"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

// ─── Corte de Caja Modal ──────────────────────────────────────────────────────

type CorteModalProps = {
  session: CashRegisterSession;
  onClose: () => void;
  onCerrarCaja: () => void;
  isCerrando: boolean;
};

function CorteModal({ session, onClose, onCerrarCaja, isCerrando }: CorteModalProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const isClosed = session.closedAt !== null;
  const openedAt = new Date(session.createdAt).toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });
  const closedAt = session.closedAt
    ? new Date(session.closedAt).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })
    : null;

  return createPortal(
    <div className="wizard-overlay fixed inset-0 z-[120] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Cerrar" />
      <div
        className="wizard-panel relative z-10 w-full max-w-md overflow-hidden rounded-[1.35rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_40px_60px_-36px_rgba(15,23,42,0.78)] sm:rounded-[1.5rem]"
        role="dialog"
        aria-modal="true"
        aria-label="Corte de caja"
      >
        <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="pill-label">Punto de Venta</p>
              <h3 className="mt-2 text-[1.35rem] leading-none text-[var(--foreground)]">
                Corte de caja
              </h3>
            </div>
            <button type="button" className="action-btn action-btn-soft" onClick={onClose}>
              Cerrar
            </button>
          </div>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            {session.warehouseName} · Cajero: {session.openedByName}
          </p>
          <p className="mt-0.5 text-xs text-[var(--ink-soft)]">
            Apertura: {openedAt}
            {closedAt ? ` · Cierre: ${closedAt}` : ""}
          </p>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <span className="text-sm text-[var(--ink-soft)]">Fondo inicial</span>
              <span className="font-semibold text-[var(--foreground)]">
                {formatMoney(session.openingBalance)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <span className="text-sm text-[var(--ink-soft)]">Ventas en efectivo</span>
              <span className="font-semibold text-[var(--success)]">
                + {formatMoney(session.totalSales)}
              </span>
            </div>
            {session.totalCortesia > 0 ? (
              <div className="flex items-center justify-between rounded-xl border border-[color:rgba(217,45,32,0.2)] bg-[color:rgba(217,45,32,0.06)] px-4 py-3">
                <span className="text-sm text-[var(--ink-soft)]">Salidas sin pago</span>
                <span className="text-sm font-semibold text-[var(--danger)]">
                  {formatMoney(session.totalCortesia)}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between rounded-xl border border-[color:rgba(31,99,85,0.3)] bg-[color:rgba(31,99,85,0.08)] px-4 py-3">
              <span className="text-base font-semibold text-[var(--foreground)]">
                Efectivo esperado en caja
              </span>
              <span className="text-base font-bold text-[var(--primary)]">
                {formatMoney(session.expectedBalance)}
              </span>
            </div>
          </div>

          {!isClosed ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={onCerrarCaja}
                disabled={isCerrando}
                className="action-btn w-full border border-[color:rgba(217,45,32,0.3)] bg-[color:rgba(217,45,32,0.08)] text-[var(--danger)] hover:bg-[color:rgba(217,45,32,0.14)] disabled:opacity-50"
              >
                {isCerrando ? "Cerrando..." : "Cerrar caja"}
              </button>
              <p className="mt-1.5 text-center text-[11px] text-[var(--ink-soft)]">
                El cierre queda registrado en el historial.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-[color:rgba(217,45,32,0.2)] bg-[color:rgba(217,45,32,0.06)] px-3 py-2 text-center text-xs text-[var(--danger)]">
              Caja cerrada el {closedAt}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Main PosRegister ─────────────────────────────────────────────────────────

export function PosRegister({
  warehouses,
  products,
  activeWarehouseId,
  activeSessionId,
}: PosRegisterProps) {
  const router = useRouter();

  // Apertura de caja modal state
  const [aperturaWarehouse, setAperturaWarehouse] = useState<Warehouse | null>(null);

  // Corte de caja state
  const [corteSession, setCorteSession] = useState<CashRegisterSession | null>(null);
  const [isLoadingCorte, setIsLoadingCorte] = useState(false);
  const [isCerrando, setIsCerrando] = useState(false);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [saleError, setSaleError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment mode
  const [saleMode, setSaleMode] = useState<SaleMode>("normal");
  const [cashReceived, setCashReceived] = useState("");
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [selectedAdminUsername, setSelectedAdminUsername] = useState("");
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  // Load admins when cortesia mode is selected
  useEffect(() => {
    if (saleMode !== "cortesia" || admins.length > 0) return;
    setIsLoadingAdmins(true);
    fetch("/api/sales?admins=1")
      .then((r) => r.json())
      .then((data: { admins?: AdminUser[] }) => {
        setAdmins(data.admins ?? []);
      })
      .catch(() => {})
      .finally(() => setIsLoadingAdmins(false));
  }, [saleMode, admins.length]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || String(p.sku).includes(q),
    );
  }, [products, searchQuery]);

  const total = useMemo(
    () => Number(cart.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)),
    [cart],
  );

  const cashValue = Number(cashReceived) || 0;
  const change = Math.max(0, Number((cashValue - total).toFixed(2)));

  const canSubmit = useMemo(() => {
    if (cart.length === 0) return false;
    if (saleMode === "cortesia") return !!selectedAdminUsername;
    return cashValue >= total;
  }, [cart.length, saleMode, selectedAdminUsername, cashValue, total]);

  const addToCart = useCallback(
    (product: ProductWithQty) => {
      setCart((prev) => {
        const existing = prev.find((item) => item.sku === product.sku);
        if (existing) {
          if (existing.quantity >= existing.maxQty) return prev;
          return prev.map((item) =>
            item.sku === product.sku ? { ...item, quantity: item.quantity + 1 } : item,
          );
        }
        return [
          ...prev,
          {
            sku: product.sku,
            name: product.name,
            price: product.price,
            quantity: 1,
            maxQty: product.qty,
          },
        ];
      });
    },
    [],
  );

  const updateQuantity = (sku: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.sku !== sku) return item;
          const next = item.quantity + delta;
          if (next <= 0) return null;
          if (next > item.maxQty) return item;
          return { ...item, quantity: next };
        })
        .filter((item): item is CartItem => item !== null),
    );
  };

  const removeFromCart = (sku: number) => {
    setCart((prev) => prev.filter((item) => item.sku !== sku));
  };

  const handleScan = useCallback(
    (text: string) => {
      setScannerOpen(false);
      try {
        const parsed = JSON.parse(text) as { sku?: number };
        if (!parsed.sku) return;
        const product = products.find((p) => p.sku === parsed.sku);
        if (!product) return;
        addToCart(product);
      } catch {
        const sku = Number(text.replace(/\D/g, ""));
        if (!sku) return;
        const product = products.find((p) => p.sku === sku);
        if (product) addToCart(product);
      }
    },
    [products, addToCart],
  );

  const handleCheckout = async () => {
    if (!canSubmit || !activeWarehouseId) return;

    const selectedAdmin = admins.find((a) => a.username === selectedAdminUsername);

    setIsSubmitting(true);
    setSaleError(null);

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseId: activeWarehouseId,
          cashReceived: saleMode === "cortesia" ? 0 : cashValue,
          saleType: saleMode,
          authorizedBy: saleMode === "cortesia" ? selectedAdmin?.username : undefined,
          authorizedByName: saleMode === "cortesia" ? selectedAdmin?.displayName : undefined,
          cashRegisterSessionId: activeSessionId ?? undefined,
          items: cart.map((item) => ({ sku: item.sku, quantity: item.quantity })),
        }),
      });

      const data = await res.json() as { sale?: { id: string }; error?: string };

      if (!res.ok) {
        setSaleError(data.error ?? "No fue posible registrar la venta.");
        return;
      }

      router.push(`/pos/recibo?saleId=${data.sale!.id}`);
    } catch {
      setSaleError("Error de conexion. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCorte = async () => {
    if (!activeSessionId) return;
    setIsLoadingCorte(true);
    try {
      const res = await fetch(`/api/cash-register?id=${activeSessionId}`);
      const data = await res.json() as { session?: CashRegisterSession };
      if (res.ok && data.session) {
        setCorteSession(data.session);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingCorte(false);
    }
  };

  const handleCerrarCaja = async () => {
    if (!activeSessionId) return;
    setIsCerrando(true);
    try {
      const res = await fetch("/api/cash-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close", sessionId: activeSessionId }),
      });
      const data = await res.json() as { session?: CashRegisterSession };
      if (res.ok && data.session) {
        setCorteSession(data.session);
      }
    } catch {
      // ignore
    } finally {
      setIsCerrando(false);
    }
  };

  // ── Warehouse selection phase ──────────────────────────────────────────────
  if (!activeWarehouseId) {
    return (
      <>
        <div className="px-4 py-8 lg:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Seleccionar almacen</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Elige el almacen desde el cual deseas vender. Se registrara la apertura de caja.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {warehouses.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setAperturaWarehouse(w)}
                  className="panel app-enter rounded-xl px-4 py-4 text-left transition hover:border-[color:rgba(31,99,85,0.4)]"
                >
                  <p className="text-lg font-semibold text-[var(--foreground)]">{w.name}</p>
                  {w.description ? (
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">{w.description}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-[var(--accent)]">Toca para abrir caja →</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {aperturaWarehouse && typeof document !== "undefined" ? (
          <AperturaModal
            warehouse={aperturaWarehouse}
            onConfirm={(sessionId) => {
              setAperturaWarehouse(null);
              router.push(`/pos?warehouseId=${aperturaWarehouse.id}&sessionId=${sessionId}`);
            }}
            onCancel={() => setAperturaWarehouse(null)}
          />
        ) : null}
      </>
    );
  }

  const activeWarehouse = warehouses.find((w) => w.id === activeWarehouseId);

  // ── Register phase ─────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-57px)]">
        {/* Left: Product search + grid */}
        <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6">
          {saleError ? (
            <div className="mb-4 rounded-lg border border-[color:rgba(217,45,32,0.28)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger-text)]">
              {saleError}
            </div>
          ) : null}

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o SKU..."
                className="form-input"
              />
            </div>
            <button
              type="button"
              className="action-btn action-btn-soft"
              onClick={() => setScannerOpen(true)}
            >
              Escanear
            </button>
            {activeSessionId ? (
              <button
                type="button"
                className="action-btn action-btn-soft text-xs"
                onClick={openCorte}
                disabled={isLoadingCorte}
              >
                {isLoadingCorte ? "..." : "Corte de caja"}
              </button>
            ) : null}
            <button
              type="button"
              className="action-btn action-btn-soft text-xs"
              onClick={() => router.push("/pos")}
            >
              Cambiar almacen
            </button>
          </div>

          {activeWarehouse ? (
            <p className="mb-3 text-xs text-[var(--ink-soft)]">
              Almacen:{" "}
              <span className="font-semibold text-[var(--foreground)]">{activeWarehouse.name}</span>
              {activeSessionId ? (
                <span className="ml-2 rounded-full bg-[color:rgba(15,157,114,0.12)] px-2 py-0.5 text-[10px] font-medium text-[var(--success)]">
                  Caja abierta
                </span>
              ) : null}
            </p>
          ) : null}

          {filteredProducts.length === 0 ? (
            <div className="panel-soft rounded-2xl border-dashed p-6 text-center text-sm text-[var(--ink-soft)]">
              {searchQuery
                ? "Sin resultados para esta busqueda."
                : "No hay productos con stock en este almacen."}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((product) => {
                const inCart = cart.find((c) => c.sku === product.sku);
                return (
                  <button
                    key={product.sku}
                    type="button"
                    onClick={() => addToCart(product)}
                    disabled={inCart ? inCart.quantity >= inCart.maxQty : false}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      inCart
                        ? "border-[color:rgba(31,99,85,0.4)] bg-[color:rgba(31,99,85,0.08)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[color:rgba(31,99,85,0.3)]"
                    } disabled:opacity-50`}
                  >
                    <p className="text-sm font-semibold text-[var(--foreground)] leading-tight">
                      {product.name}
                    </p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">SKU {product.sku}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-[var(--primary-strong)]">
                        {formatMoney(product.price)}
                      </span>
                      <span className="text-[0.68rem] text-[var(--ink-soft)]">
                        Disp: {product.qty}
                      </span>
                    </div>
                    {inCart ? (
                      <p className="mt-1 text-[0.68rem] font-semibold text-[var(--accent)]">
                        En carrito: {inCart.quantity}
                      </p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Cart + payment */}
        <div className="border-t border-[var(--border)] bg-[var(--surface-glass)] lg:w-[400px] lg:border-l lg:border-t-0">
          <div className="flex h-full flex-col">
            <div className="border-b border-[var(--border-light)] px-4 py-3">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Carrito</h3>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {cart.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--ink-soft)]">
                  Agrega productos para comenzar.
                </p>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div
                      key={item.sku}
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[var(--foreground)]">
                            {item.name}
                          </p>
                          <p className="text-xs text-[var(--ink-soft)]">
                            {formatMoney(item.price)} c/u
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.sku)}
                          className="text-xs text-[var(--danger)] hover:underline"
                        >
                          Quitar
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.sku, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-sm font-bold"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.sku, 1)}
                            disabled={item.quantity >= item.maxQty}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-sm font-bold disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-[var(--foreground)]">
                          {formatMoney(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment section */}
            <div className="border-t border-[var(--border-light)] px-4 py-4 space-y-3">
              {/* Total */}
              <div className="flex items-center justify-between text-lg font-bold text-[var(--foreground)]">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>

              {/* Mode selector */}
              <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
                <button
                  type="button"
                  onClick={() => { setSaleMode("normal"); setSelectedAdminUsername(""); }}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    saleMode === "normal"
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "text-[var(--ink-soft)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Venta normal
                </button>
                <button
                  type="button"
                  onClick={() => { setSaleMode("cortesia"); setCashReceived(""); }}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    saleMode === "cortesia"
                      ? "bg-[color:rgba(217,45,32,0.15)] text-[var(--danger)] shadow-sm"
                      : "text-[var(--ink-soft)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Salida sin pago
                </button>
              </div>

              {/* Normal mode: cash input */}
              {saleMode === "normal" ? (
                <>
                  <label className="block">
                    <span className="text-xs font-medium text-[var(--ink-soft)]">Monto recibido</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="form-input mt-1"
                      placeholder="0.00"
                    />
                  </label>

                  {cashValue > 0 && cashValue >= total ? (
                    <div className="flex items-center justify-between rounded-lg bg-[color:rgba(15,157,114,0.1)] px-3 py-2 text-sm">
                      <span className="text-[var(--ink-soft)]">Cambio</span>
                      <span className="font-bold text-[var(--success)]">{formatMoney(change)}</span>
                    </div>
                  ) : null}
                </>
              ) : null}

              {/* Cortesia mode: admin selector */}
              {saleMode === "cortesia" ? (
                <div className="space-y-2">
                  <div className="rounded-xl border border-[color:rgba(217,45,32,0.2)] bg-[color:rgba(217,45,32,0.06)] px-3 py-2 text-xs text-[var(--danger)]">
                    Salida sin cobro — Los productos se descuentan del inventario sin registro de pago.
                  </div>
                  <label className="block">
                    <span className="text-xs font-medium text-[var(--ink-soft)]">Admin que autoriza</span>
                    {isLoadingAdmins ? (
                      <p className="mt-1 text-xs text-[var(--ink-soft)]">Cargando admins...</p>
                    ) : (
                      <select
                        value={selectedAdminUsername}
                        onChange={(e) => setSelectedAdminUsername(e.target.value)}
                        className="form-input mt-1"
                      >
                        <option value="">Seleccionar administrador...</option>
                        {admins.map((admin) => (
                          <option key={admin.username} value={admin.username}>
                            {admin.displayName} (@{admin.username})
                          </option>
                        ))}
                      </select>
                    )}
                  </label>
                </div>
              ) : null}

              {/* Checkout button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={!canSubmit || isSubmitting}
                className={`action-btn w-full disabled:opacity-50 disabled:hover:transform-none ${
                  saleMode === "cortesia"
                    ? "border border-[color:rgba(217,45,32,0.3)] bg-[color:rgba(217,45,32,0.1)] text-[var(--danger)] hover:bg-[color:rgba(217,45,32,0.16)]"
                    : "action-btn-primary"
                }`}
              >
                {isSubmitting
                  ? "Procesando..."
                  : saleMode === "cortesia"
                    ? "Registrar salida sin pago"
                    : `Cobrar ${canSubmit ? formatMoney(total) : ""}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {scannerOpen ? (
        <QrScanner
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
          label="Escanear producto"
        />
      ) : null}

      {corteSession && typeof document !== "undefined" ? (
        <CorteModal
          session={corteSession}
          onClose={() => setCorteSession(null)}
          onCerrarCaja={handleCerrarCaja}
          isCerrando={isCerrando}
        />
      ) : null}
    </>
  );
}
