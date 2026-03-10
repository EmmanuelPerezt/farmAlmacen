"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";

import type { ProductWithStock, Warehouse } from "@/lib/types";

type MovementWizardModalProps = {
  products: ProductWithStock[];
  warehouses: Warehouse[];
  formError?: string;
};

type MovementType = "entrada" | "salida" | "traslado";

type WizardForm = {
  type: MovementType;
  sku: string;
  quantity: string;
  sourceWarehouseId: string;
  targetWarehouseId: string;
  note: string;
};

const stepLabels = ["Tipo", "Producto", "Ubicaciones", "Confirmar"];

const movementTypeMeta: Record<
  MovementType,
  { label: string; description: string; tone: string }
> = {
  entrada: {
    label: "Entrada",
    description: "Recibes unidades en un almacen destino",
    tone: "text-[var(--success)]",
  },
  salida: {
    label: "Salida",
    description: "Despachas unidades desde un almacen origen",
    tone: "text-[var(--accent)]",
  },
  traslado: {
    label: "Traslado",
    description: "Mueves stock entre dos almacenes",
    tone: "text-[var(--primary-strong)]",
  },
};

function getDefaultForm(): WizardForm {
  return {
    type: "entrada",
    sku: "",
    quantity: "",
    sourceWarehouseId: "",
    targetWarehouseId: "",
    note: "",
  };
}

export function MovementWizardModal({ products, warehouses, formError }: MovementWizardModalProps) {
  const [isOpen, setIsOpen] = useState(Boolean(formError));
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [form, setForm] = useState<WizardForm>(getDefaultForm);
  const lastStepEnteredAtRef = useRef(0);

  const selectedProduct = useMemo(
    () => products.find((item) => String(item.sku) === form.sku),
    [products, form.sku],
  );

  const quantityValue = useMemo(() => Number(form.quantity), [form.quantity]);

  const sourceStock = useMemo(() => {
    if (!selectedProduct || !form.sourceWarehouseId) {
      return 0;
    }

    return (
      selectedProduct.stockByWarehouse.find(
        (stock) => stock.warehouseId === form.sourceWarehouseId,
      )?.qty ?? 0
    );
  }, [form.sourceWarehouseId, selectedProduct]);

  const selectedSourceWarehouse = useMemo(
    () => warehouses.find((warehouse) => warehouse.id === form.sourceWarehouseId),
    [form.sourceWarehouseId, warehouses],
  );

  const selectedTargetWarehouse = useMemo(
    () => warehouses.find((warehouse) => warehouse.id === form.targetWarehouseId),
    [form.targetWarehouseId, warehouses],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.body.style.overflow = "hidden";

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  const updateForm = <K extends keyof WizardForm>(field: K, value: WizardForm[K]) => {
    setStepError(null);

    setForm((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };

      if (field === "type") {
        if (value === "entrada") {
          next.sourceWarehouseId = "";
        }

        if (value === "salida") {
          next.targetWarehouseId = "";
        }
      }

      return next;
    });
  };

  const validateStep = (targetStep: number): string | null => {
    if (targetStep <= 2) {
      return null;
    }

    if (targetStep === 3) {
      if (!form.sku) {
        return "Selecciona un producto para continuar.";
      }

      if (!Number.isInteger(quantityValue) || quantityValue <= 0) {
        return "La cantidad debe ser un numero entero positivo.";
      }

      return null;
    }

    if (form.type === "entrada") {
      if (!form.targetWarehouseId) {
        return "Debes seleccionar almacen destino para una entrada.";
      }
    }

    if (form.type === "salida") {
      if (!form.sourceWarehouseId) {
        return "Debes seleccionar almacen origen para una salida.";
      }

      if (quantityValue > sourceStock) {
        return "Stock insuficiente en origen. No se permite stock negativo.";
      }
    }

    if (form.type === "traslado") {
      if (!form.sourceWarehouseId || !form.targetWarehouseId) {
        return "Debes seleccionar almacen origen y destino para un traslado.";
      }

      if (form.sourceWarehouseId === form.targetWarehouseId) {
        return "El traslado requiere almacenes distintos.";
      }

      if (quantityValue > sourceStock) {
        return "Stock insuficiente en origen. No se permite stock negativo.";
      }
    }

    return null;
  };

  const handleNext = () => {
    const error = validateStep(step + 1);

    if (error) {
      setStepError(error);
      return;
    }

    const nextStep = Math.min(step + 1, 4);
    setStepError(null);
    setStep(nextStep);

    if (nextStep === 4) {
      lastStepEnteredAtRef.current = Date.now();
    }
  };

  const handlePrev = () => {
    setStepError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const openModal = () => {
    setStep(1);
    setStepError(null);
    setForm(getDefaultForm());
    lastStepEnteredAtRef.current = 0;
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setStepError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (step < 4) {
      event.preventDefault();
      return;
    }

    if (Date.now() - lastStepEnteredAtRef.current < 450) {
      event.preventDefault();
      return;
    }

    const error = validateStep(4);

    if (error) {
      event.preventDefault();
      setStepError(error);
      setStep(error.includes("producto") || error.includes("cantidad") ? 2 : 3);
    }
  };

  const handleFormKeyDown = (event: ReactKeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    const targetTag = (event.target as HTMLElement).tagName;
    if (targetTag === "TEXTAREA") {
      return;
    }

    if (step < 4) {
      event.preventDefault();
      handleNext();
      return;
    }

    event.preventDefault();
  };

  return (
    <>
        <div className="flex flex-wrap items-end justify-end gap-4">
          <button type="button" className="action-btn action-btn-primary" onClick={openModal}>
            Nuevo movimiento
          </button>
        </div>

      {typeof document !== "undefined" && isOpen
        ? createPortal(
        <div className="wizard-overlay fixed inset-0 z-[120] flex items-end justify-center p-3 sm:items-center sm:p-6">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={closeModal}
            aria-label="Cerrar modal"
          />

          <div
            className="wizard-panel relative z-10 flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.35rem] border border-[color:rgba(148,163,184,0.35)] bg-[var(--surface)] shadow-[0_40px_60px_-36px_rgba(15,23,42,0.78)] sm:max-h-[90dvh] sm:rounded-[1.5rem]"
            role="dialog"
            aria-modal="true"
            aria-label="Registrar movimiento"
          >
            <div className="shrink-0 border-b border-[var(--border)] px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="pill-label">Asistente</p>
                  <h3 className="mt-2 text-[1.42rem] leading-none text-[var(--foreground)]">
                    Registrar movimiento
                  </h3>
                </div>

                <button type="button" className="action-btn action-btn-soft" onClick={closeModal}>
                  Cerrar
                </button>
              </div>

              <ol className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                {stepLabels.map((label, index) => {
                  const stepNumber = index + 1;
                  const isCurrent = stepNumber === step;
                  const isDone = stepNumber < step;

                  return (
                    <li
                      key={label}
                      className={`wizard-step rounded-xl border px-3 py-2 text-xs transition ${
                        isCurrent
                          ? "border-[color:rgba(31,99,85,0.35)] bg-[color:rgba(31,99,85,0.12)]"
                          : isDone
                            ? "border-[color:rgba(15,157,114,0.3)] bg-[color:rgba(15,157,114,0.1)]"
                            : "border-[var(--border-light)] bg-[var(--surface)]"
                      }`}
                    >
                      <span className="block font-mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                        Paso {stepNumber}
                      </span>
                      <span className="mt-1 block font-semibold text-[var(--foreground)]">{label}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            <form
              action="/api/movements"
              method="post"
              onSubmit={handleSubmit}
              onKeyDown={handleFormKeyDown}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                {formError ? (
                  <div className="mb-4 rounded-xl border border-[color:rgba(217,45,32,0.34)] bg-[color:rgba(217,45,32,0.08)] px-3 py-2 text-sm text-[color:#9b2c2c]">
                    {formError}
                  </div>
                ) : null}

                {stepError ? (
                  <div className="mb-4 rounded-xl border border-[color:rgba(47,138,119,0.34)] bg-[color:rgba(47,138,119,0.12)] px-3 py-2 text-sm text-[color:#1f6355]">
                    {stepError}
                  </div>
                ) : null}

                {step === 1 ? (
                  <section className="app-enter space-y-3">
                    <p className="text-sm text-[var(--ink-soft)]">Selecciona el tipo de operacion.</p>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {(["entrada", "salida", "traslado"] as const).map((typeOption) => {
                        const active = form.type === typeOption;
                        const meta = movementTypeMeta[typeOption];

                        return (
                          <button
                            key={typeOption}
                            type="button"
                            onClick={() => updateForm("type", typeOption)}
                            className={`rounded-2xl border px-4 py-4 text-left transition ${
                              active
                                ? "border-[color:rgba(31,99,85,0.4)] bg-[color:rgba(31,99,85,0.12)]"
                                : "border-[var(--border-light)] bg-[var(--surface)] hover:border-[color:rgba(31,99,85,0.32)]"
                            }`}
                          >
                            <p className={`text-sm font-semibold ${meta.tone}`}>{meta.label}</p>
                            <p className="mt-1 text-xs text-[var(--ink-soft)]">{meta.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                {step === 2 ? (
                  <section className="app-enter grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                        Producto
                      </span>
                      <select
                        value={form.sku}
                        onChange={(event) => updateForm("sku", event.target.value)}
                        className="form-input"
                      >
                        <option value="">Selecciona un producto</option>
                        {products.map((product) => (
                          <option key={product.sku} value={String(product.sku)}>
                            {product.name} (SKU {product.sku})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                        Cantidad
                      </span>
                      <input
                        value={form.quantity}
                        onChange={(event) => updateForm("quantity", event.target.value)}
                        type="number"
                        min={1}
                        step={1}
                        className="form-input"
                        placeholder="10"
                      />
                    </label>

                    {selectedProduct ? (
                      <div className="panel-soft rounded-xl px-3 py-2 text-xs text-[var(--ink-soft)] sm:col-span-2">
                        <p className="font-semibold text-[var(--foreground)]">Producto seleccionado</p>
                        <p className="mt-1">
                          {selectedProduct.name} - stock total {selectedProduct.totalQty} unidades
                        </p>
                      </div>
                    ) : null}
                  </section>
                ) : null}

                {step === 3 ? (
                  <section className="app-enter grid gap-4 sm:grid-cols-2">
                    {form.type !== "entrada" ? (
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                          Almacen origen
                        </span>
                        <select
                          value={form.sourceWarehouseId}
                          onChange={(event) => updateForm("sourceWarehouseId", event.target.value)}
                          className="form-input"
                        >
                          <option value="">Selecciona un almacen</option>
                          {warehouses.map((warehouse) => (
                            <option key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <div className="panel-soft rounded-xl px-3 py-3 text-sm text-[var(--ink-soft)]">
                        En una entrada no necesitas almacen origen.
                      </div>
                    )}

                    {form.type !== "salida" ? (
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                          Almacen destino
                        </span>
                        <select
                          value={form.targetWarehouseId}
                          onChange={(event) => updateForm("targetWarehouseId", event.target.value)}
                          className="form-input"
                        >
                          <option value="">Selecciona un almacen</option>
                          {warehouses.map((warehouse) => (
                            <option key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <div className="panel-soft rounded-xl px-3 py-3 text-sm text-[var(--ink-soft)]">
                        En una salida no necesitas almacen destino.
                      </div>
                    )}

                    {form.type !== "entrada" && form.sourceWarehouseId ? (
                      <div className="rounded-xl border border-[color:rgba(31,99,85,0.3)] bg-[color:rgba(31,99,85,0.09)] px-3 py-2 text-xs text-[var(--foreground)] sm:col-span-2">
                        <p>
                          Stock disponible en origen: <strong>{sourceStock}</strong> unidades.
                        </p>
                        {Number.isInteger(quantityValue) && quantityValue > sourceStock ? (
                          <p className="mt-1 text-[color:#9b2c2c]">
                            La cantidad supera el disponible. El sistema rechazara este movimiento.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </section>
                ) : null}

                {step === 4 ? (
                  <section className="app-enter space-y-4">
                    <div className="panel-soft rounded-2xl px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">Resumen</p>
                      <div className="mt-2 grid gap-3 text-sm sm:grid-cols-2">
                        <p className="text-[var(--ink-soft)]">
                          Tipo: {" "}
                          <span className="font-semibold text-[var(--foreground)]">
                            {movementTypeMeta[form.type].label}
                          </span>
                        </p>
                        <p className="text-[var(--ink-soft)]">
                          Producto:{" "}
                          <span className="font-semibold text-[var(--foreground)]">
                            {selectedProduct?.name ?? "-"}
                          </span>
                        </p>
                        <p className="text-[var(--ink-soft)]">
                          Cantidad:{" "}
                          <span className="font-semibold text-[var(--foreground)]">
                            {form.quantity || "-"}
                          </span>
                        </p>
                        <p className="text-[var(--ink-soft)]">
                          Origen:{" "}
                          <span className="font-semibold text-[var(--foreground)]">
                            {selectedSourceWarehouse?.name ?? "-"}
                          </span>
                        </p>
                        <p className="text-[var(--ink-soft)]">
                          Destino:{" "}
                          <span className="font-semibold text-[var(--foreground)]">
                            {selectedTargetWarehouse?.name ?? "-"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                        Nota (opcional)
                      </span>
                      <textarea
                        value={form.note}
                        onChange={(event) => updateForm("note", event.target.value)}
                        rows={3}
                        placeholder="Observacion del movimiento"
                        className="form-input"
                      />
                    </label>

                  </section>
                ) : null}

                <input type="hidden" name="type" value={form.type} />
                <input type="hidden" name="sku" value={form.sku} />
                <input type="hidden" name="quantity" value={form.quantity} />
                <input type="hidden" name="sourceWarehouseId" value={form.sourceWarehouseId} />
                <input type="hidden" name="targetWarehouseId" value={form.targetWarehouseId} />
                <input type="hidden" name="note" value={form.note} />
              </div>

              <div className="shrink-0 border-t border-[var(--border-light)] px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[var(--ink-soft)]">
                    Paso {step} de 4 - flujo guiado para reducir errores operativos.
                  </p>

                  <div className="flex items-center gap-2">
                    {step > 1 ? (
                      <button type="button" className="action-btn action-btn-soft" onClick={handlePrev}>
                        Anterior
                      </button>
                    ) : null}

                    {step < 4 ? (
                      <button type="button" className="action-btn action-btn-primary" onClick={handleNext}>
                        Siguiente
                      </button>
                    ) : (
                      <button type="submit" className="action-btn action-btn-primary">
                        Confirmar movimiento
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
