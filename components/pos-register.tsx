"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { QrScanner } from "@/components/qr-scanner";
import { formatMoney } from "@/lib/format";
import type { Product, Warehouse } from "@/lib/types";

type ProductWithQty = Product & { qty: number };

type CartItem = {
  sku: number;
  name: string;
  price: number;
  quantity: number;
  maxQty: number;
};

type PosRegisterProps = {
  warehouses: Warehouse[];
  products: ProductWithQty[];
  activeWarehouseId?: string;
  error?: string;
};

export function PosRegister({ warehouses, products, activeWarehouseId, error }: PosRegisterProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cashReceived, setCashReceived] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
  const canSubmit = cart.length > 0 && cashValue >= total;

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
        const parsed = JSON.parse(text) as { sku?: number; name?: string; price?: number };
        if (!parsed.sku) return;
        const product = products.find((p) => p.sku === parsed.sku);
        if (!product) return;
        addToCart(product);
      } catch {
        // Try numeric SKU fallback
        const sku = Number(text.replace(/\D/g, ""));
        if (!sku) return;
        const product = products.find((p) => p.sku === sku);
        if (product) addToCart(product);
      }
    },
    [products, addToCart],
  );

  // Warehouse selection phase
  if (!activeWarehouseId) {
    return (
      <div className="px-4 py-8 lg:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Seleccionar almacen</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Elige el almacen desde el cual deseas vender.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {warehouses.map((w) => (
              <Link
                key={w.id}
                href={`/pos?warehouseId=${w.id}`}
                className="panel app-enter rounded-xl px-4 py-4 transition hover:border-[color:rgba(31,99,85,0.4)]"
              >
                <p className="text-lg font-semibold text-[var(--foreground)]">{w.name}</p>
                {w.description ? (
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{w.description}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeWarehouse = warehouses.find((w) => w.id === activeWarehouseId);

  // Register phase
  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-57px)]">
      {/* Left: Product search + grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6">
        {error ? (
          <div className="mb-4 rounded-lg border border-[color:rgba(185,28,28,0.28)] bg-[color:rgba(185,28,28,0.08)] px-3 py-2 text-sm text-[color:#991b1b]">
            {error}
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
            Escanear QR
          </button>
          <Link href="/pos" className="action-btn action-btn-soft text-xs">
            Cambiar almacen
          </Link>
        </div>

        {activeWarehouse ? (
          <p className="mb-3 text-xs text-[var(--ink-soft)]">
            Almacen: <span className="font-semibold text-[var(--foreground)]">{activeWarehouse.name}</span>
          </p>
        ) : null}

        {filteredProducts.length === 0 ? (
          <div className="panel-soft rounded-2xl border-dashed p-6 text-center text-sm text-[var(--ink-soft)]">
            {searchQuery ? "Sin resultados para esta busqueda." : "No hay productos con stock en este almacen."}
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
                      : "border-[color:rgba(148,163,184,0.3)] bg-[color:rgba(255,255,255,0.85)] hover:border-[color:rgba(31,99,85,0.3)]"
                  } disabled:opacity-50`}
                >
                  <p className="text-sm font-semibold text-[var(--foreground)] leading-tight">{product.name}</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">SKU {product.sku}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--primary-strong)]">{formatMoney(product.price)}</span>
                    <span className="text-[0.68rem] text-[var(--ink-soft)]">Disp: {product.qty}</span>
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
      <div className="border-t border-[color:rgba(148,163,184,0.28)] bg-[color:rgba(248,252,255,0.95)] lg:w-[380px] lg:border-l lg:border-t-0">
        <div className="flex h-full flex-col">
          <div className="border-b border-[color:rgba(148,163,184,0.2)] px-4 py-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Carrito</h3>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {cart.length === 0 ? (
              <p className="text-center text-sm text-[var(--ink-soft)] py-6">
                Agrega productos para comenzar.
              </p>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.sku}
                    className="rounded-lg border border-[color:rgba(148,163,184,0.28)] bg-white px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">{item.name}</p>
                        <p className="text-xs text-[var(--ink-soft)]">{formatMoney(item.price)} c/u</p>
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
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-[color:rgba(148,163,184,0.34)] bg-white text-sm font-bold"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.sku, 1)}
                          disabled={item.quantity >= item.maxQty}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-[color:rgba(148,163,184,0.34)] bg-white text-sm font-bold disabled:opacity-40"
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
          <div className="border-t border-[color:rgba(148,163,184,0.2)] px-4 py-4">
            <div className="flex items-center justify-between text-lg font-bold text-[var(--foreground)]">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>

            <label className="mt-3 block">
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
              <div className="mt-2 flex items-center justify-between rounded-lg bg-[color:rgba(15,157,114,0.1)] px-3 py-2 text-sm">
                <span className="text-[var(--ink-soft)]">Cambio</span>
                <span className="font-bold text-[var(--success)]">{formatMoney(change)}</span>
              </div>
            ) : null}

            <form action="/api/sales" method="post" className="mt-3">
              <input type="hidden" name="warehouseId" value={activeWarehouseId} />
              <input type="hidden" name="cashReceived" value={cashValue} />
              <input
                type="hidden"
                name="items"
                value={JSON.stringify(cart.map((item) => ({ sku: item.sku, quantity: item.quantity })))}
              />
              <button
                type="submit"
                disabled={!canSubmit}
                className="action-btn action-btn-primary w-full disabled:opacity-50 disabled:hover:transform-none"
              >
                Cobrar {canSubmit ? formatMoney(total) : ""}
              </button>
            </form>
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
    </div>
  );
}
