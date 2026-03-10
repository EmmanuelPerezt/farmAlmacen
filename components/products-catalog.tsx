"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { formatMoney } from "@/lib/format";
import type { ProductWithStock } from "@/lib/types";

type ProductsCatalogProps = {
  products: ProductWithStock[];
  isAdmin: boolean;
};

type ProductEditPanelProps = {
  product: ProductWithStock;
  onClose: () => void;
};

function ProductEditPanel({ product, onClose }: ProductEditPanelProps) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsUpdating(true);
    setUpdateError(null);

    try {
      const res = await fetch(`/api/products/${product.sku}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price: Number(price) }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setUpdateError(data.error ?? "No fue posible actualizar.");
        return;
      }

      onClose();
      router.refresh();
    } catch {
      setUpdateError("Error de conexion.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/products/${product.sku}`, {
        method: "DELETE",
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setDeleteError(data.error ?? "No fue posible eliminar.");
        return;
      }

      onClose();
      router.refresh();
    } catch {
      setDeleteError("Error de conexion.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mt-3 grid gap-3">
      <form onSubmit={handleUpdate} className="grid gap-2 sm:grid-cols-2">
        <input
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="form-input"
        />
        <input
          name="price"
          type="number"
          min={0}
          step="0.01"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="form-input"
        />
        {updateError ? (
          <p className="text-xs text-[var(--danger-text)] sm:col-span-2">{updateError}</p>
        ) : null}
        <button
          type="submit"
          className="action-btn action-btn-soft sm:col-span-2"
          disabled={isUpdating}
        >
          {isUpdating ? "Guardando..." : "Actualizar"}
        </button>
      </form>

      {deleteError ? (
        <p className="text-xs text-[var(--danger-text)]">{deleteError}</p>
      ) : null}
      <button
        type="button"
        onClick={handleDelete}
        className="action-btn action-btn-danger w-full"
        disabled={isDeleting}
      >
        {isDeleting ? "Eliminando..." : "Eliminar producto"}
      </button>
    </div>
  );
}

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
        "border-[color:rgba(217,45,32,0.26)] bg-[color:rgba(217,45,32,0.1)] text-[var(--danger-text)]",
      ringClassName: "border-[color:rgba(217,45,32,0.26)]",
    };
  }

  if (status === "medio") {
    return {
      label: "Medio",
      chipClassName:
        "border-[color:rgba(245,158,11,0.28)] bg-[color:rgba(245,158,11,0.12)] text-[var(--ink-muted)]",
      ringClassName: "border-[color:rgba(245,158,11,0.3)]",
    };
  }

  return {
    label: "Estable",
    chipClassName:
      "border-[color:rgba(15,157,114,0.24)] bg-[color:rgba(15,157,114,0.1)] text-[var(--accent)]",
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
                className={`group relative overflow-hidden rounded-2xl border bg-[var(--surface)] p-4 shadow-[0_18px_35px_-30px_rgba(15,23,42,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_38px_-28px_rgba(31,99,85,0.35)] ${stockMeta.ringClassName}`}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(31,99,85,0.08),transparent)]" />

                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="line-clamp-2 text-base font-semibold text-[var(--foreground)]">{product.name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--ink-soft)]">
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
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-glass)] px-3 py-2">
                      <p className="text-[0.66rem] uppercase tracking-[0.12em] text-[var(--ink-soft)]">Stock total</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{product.totalQty}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-glass)] px-3 py-2">
                      <p className="text-[0.66rem] uppercase tracking-[0.12em] text-[var(--ink-soft)]">Almacenes</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                        {product.stockByWarehouse.filter((stock) => stock.qty > 0).length}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-[var(--border-light)] bg-[var(--surface)] p-3">
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
                          <div className="h-1.5 rounded-full bg-[var(--border-light)]">
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
                    <div className="mt-4 border-t border-[var(--border-light)] pt-3">
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
                        <ProductEditPanel
                          product={product}
                          onClose={() =>
                            setEditingSkus((prev) => ({ ...prev, [product.sku]: false }))
                          }
                        />
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
