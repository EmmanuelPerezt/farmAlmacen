"use client";

import { useMemo, useState } from "react";

import { formatMoney } from "@/lib/format";
import type { ProductWithStock } from "@/lib/types";

type ProductsCatalogProps = {
  products: ProductWithStock[];
  isAdmin: boolean;
};

function getStockStatus(totalQty: number): "critico" | "medio" | "estable" {
  if (totalQty <= 10) {
    return "critico";
  }

  if (totalQty <= 35) {
    return "medio";
  }

  return "estable";
}

function getStockMeta(totalQty: number): {
  label: string;
  chipClassName: string;
  ringClassName: string;
} {
  const status = getStockStatus(totalQty);

  if (status === "critico") {
    return {
      label: "Critico",
      chipClassName:
        "border-[color:rgba(217,45,32,0.26)] bg-[color:rgba(217,45,32,0.1)] text-[color:#9b2c2c]",
      ringClassName: "border-[color:rgba(217,45,32,0.26)]",
    };
  }

  if (status === "medio") {
    return {
      label: "Medio",
      chipClassName:
        "border-[color:rgba(245,158,11,0.28)] bg-[color:rgba(245,158,11,0.12)] text-[color:#92400e]",
      ringClassName: "border-[color:rgba(245,158,11,0.3)]",
    };
  }

  return {
    label: "Estable",
    chipClassName:
      "border-[color:rgba(15,157,114,0.24)] bg-[color:rgba(15,157,114,0.1)] text-[color:#0f766e]",
    ringClassName: "border-[color:rgba(15,157,114,0.24)]",
  };
}

function toPercentage(value: number, max: number): string {
  if (max <= 0) {
    return "0%";
  }

  return `${Math.max(6, Math.round((value / max) * 100))}%`;
}

export function ProductsCatalog({ products, isAdmin }: ProductsCatalogProps) {
  const [query, setQuery] = useState("");
  const [editingSkus, setEditingSkus] = useState<Record<string, boolean>>({});

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return products;
    }

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(normalizedQuery) ||
        String(product.sku).includes(normalizedQuery),
    );
  }, [products, query]);

  return (
    <div className="space-y-4">
      <div>
        <div className="grid gap-2 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="block">
            <span className="sr-only">que pasa perro</span>
            <div className="flex items-center gap-2 ">
              <span>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
                  <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="form-input pl-9"
              />
            </div>
          </label>

          {query.trim() ? (
            <div className="text-sm text-[var(--ink-soft)] lg:pb-2 lg:text-right">
              {visibleProducts.length} resultados
            </div>
          ) : null}
        </div>
      </div>

      {visibleProducts.length === 0 ? (
        <div className="panel-soft rounded-2xl border border-dashed p-6 text-sm text-[var(--ink-soft)] text-center">
          No hay coincidencias con la busqueda actual.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visibleProducts.map((product) => {
            const stockMeta = getStockMeta(product.totalQty);
            const maxQty = Math.max(
              1,
              ...product.stockByWarehouse.map((warehouseStock) => warehouseStock.qty),
            );
            const isEditing = Boolean(editingSkus[product.sku]);

            return (
              <article
                key={product.sku}
                className={`group relative overflow-hidden rounded-2xl border bg-white p-4 shadow-[0_18px_35px_-30px_rgba(15,23,42,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_38px_-28px_rgba(31,99,85,0.35)] ${stockMeta.ringClassName}`}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(31,99,85,0.08),transparent)]" />

                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="line-clamp-2 text-base font-semibold text-[var(--foreground)]">{product.name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full border border-[color:rgba(148,163,184,0.36)] bg-white px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--ink-soft)]">
                          SKU {product.sku}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold ${stockMeta.chipClassName}`}
                        >
                          {stockMeta.label}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[0.66rem] uppercase tracking-[0.12em] text-[var(--ink-soft)]">Precio</p>
                      <p className="text-lg font-semibold text-[var(--foreground)]">{formatMoney(product.price)}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-[color:rgba(148,163,184,0.3)] bg-[color:rgba(248,251,255,0.8)] px-3 py-2">
                      <p className="text-[0.66rem] uppercase tracking-[0.12em] text-[var(--ink-soft)]">Stock total</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{product.totalQty}</p>
                    </div>
                    <div className="rounded-xl border border-[color:rgba(148,163,184,0.3)] bg-[color:rgba(248,251,255,0.8)] px-3 py-2">
                      <p className="text-[0.66rem] uppercase tracking-[0.12em] text-[var(--ink-soft)]">Almacenes</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                        {product.stockByWarehouse.filter((stock) => stock.qty > 0).length}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-[color:rgba(148,163,184,0.28)] bg-[color:rgba(255,255,255,0.82)] p-3">
                    <p className="text-[0.66rem] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                      Distribucion por almacen
                    </p>
                    <div className="mt-2 space-y-2">
                      {product.stockByWarehouse.map((stock) => (
                        <div key={`${product.sku}-${stock.warehouseId}`}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <p className="max-w-[72%] truncate text-[var(--ink-soft)]">{stock.warehouseName}</p>
                            <p className="font-semibold text-[var(--foreground)]">{stock.qty}</p>
                          </div>
                          <div className="h-1.5 rounded-full bg-[color:rgba(148,163,184,0.24)]">
                            <div
                              className="h-1.5 rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))]"
                              style={{ width: toPercentage(stock.qty, maxQty) }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {isAdmin ? (
                    <div className="mt-4 border-t border-[color:rgba(148,163,184,0.28)] pt-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[0.66rem] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                          Gestion rapida
                        </p>
                        <button
                          type="button"
                          className="action-btn action-btn-soft"
                          onClick={() =>
                            setEditingSkus((previous) => ({
                              ...previous,
                              [product.sku]: !previous[product.sku],
                            }))
                          }
                          aria-expanded={isEditing}
                        >
                          {isEditing ? "Cerrar edicion" : "Editar"}
                        </button>
                      </div>

                      {isEditing ? (
                        <div className="mt-3 grid gap-3">
                          <form action="/api/products" method="post" className="grid gap-2 sm:grid-cols-2">
                            <input type="hidden" name="intent" value="update" />
                            <input type="hidden" name="sku" value={product.sku} />

                            <input
                              name="name"
                              type="text"
                              required
                              defaultValue={product.name}
                              className="form-input"
                            />
                            <input
                              name="price"
                              type="number"
                              min={0}
                              step="0.01"
                              required
                              defaultValue={product.price}
                              className="form-input"
                            />
                            <button type="submit" className="action-btn action-btn-soft sm:col-span-2">
                              Actualizar
                            </button>
                          </form>

                          <form action="/api/products" method="post" className="w-full">
                            <input type="hidden" name="intent" value="delete" />
                            <input type="hidden" name="sku" value={product.sku} />
                            <button type="submit" className="action-btn action-btn-danger w-full">
                              Eliminar producto
                            </button>
                          </form>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-[var(--ink-soft)]">
                          Pulsa Editar para mostrar acciones de mantenimiento.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
