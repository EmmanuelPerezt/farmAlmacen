"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

type WarehouseActionsProps = {
  warehouseId: string;
  warehouseName: string;
  warehouseDescription: string;
};

export function WarehouseActions({
  warehouseId,
  warehouseName,
  warehouseDescription,
}: WarehouseActionsProps) {
  const router = useRouter();
  const [name, setName] = useState(warehouseName);
  const [description, setDescription] = useState(warehouseDescription);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsUpdating(true);
    setUpdateError(null);

    try {
      const res = await fetch(`/api/warehouses/${warehouseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setUpdateError(data.error ?? "No fue posible actualizar el almacen.");
        return;
      }

      router.refresh();
    } catch {
      setUpdateError("Error de conexion. Intenta nuevamente.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/warehouses/${warehouseId}`, {
        method: "DELETE",
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setDeleteError(data.error ?? "No fue posible eliminar el almacen.");
        return;
      }

      router.refresh();
    } catch {
      setDeleteError("Error de conexion. Intenta nuevamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mt-4 border-t border-[var(--border)] pt-3">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[color:rgba(31,99,85,0.45)] [&::-webkit-details-marker]:hidden">
          Editar
          <svg
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            className="h-4 w-4 text-[var(--ink-soft)] transition-transform group-open:rotate-180"
          >
            <path
              d="m5 8 5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
          <form onSubmit={handleUpdate} className="grid gap-2">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
            />
            {updateError ? (
              <p className="text-xs text-[var(--danger-text)]">{updateError}</p>
            ) : null}
            <button
              type="submit"
              className="action-btn action-btn-soft"
              disabled={isUpdating}
            >
              {isUpdating ? "Guardando..." : "Actualizar almacen"}
            </button>
          </form>

          <div className="flex flex-col gap-2">
            {deleteError ? (
              <p className="text-xs text-[var(--danger-text)]">{deleteError}</p>
            ) : null}
            <button
              type="button"
              onClick={handleDelete}
              className="action-btn action-btn-danger"
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}
