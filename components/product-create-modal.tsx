"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { IScannerControls } from "@zxing/browser";

import type { Warehouse } from "@/lib/types";

type ProductCreateModalProps = {
  warehouses: Warehouse[];
};

type ProductWizardForm = {
  sku: string;
  name: string;
  price: string;
  initialQty: string;
  initialWarehouseId: string;
};

const stepLabels = ["Datos", "Stock", "Confirmar"];

function getDefaultForm(): ProductWizardForm {
  return {
    sku: "",
    name: "",
    price: "",
    initialQty: "0",
    initialWarehouseId: "",
  };
}

export function ProductCreateModal({ warehouses }: ProductCreateModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<ProductWizardForm>(getDefaultForm);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScannerBooting, setIsScannerBooting] = useState(false);
  const [isTorchAvailable, setIsTorchAvailable] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isTorchLoading, setIsTorchLoading] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const lastStepEnteredAtRef = useRef(0);
  const scannerVideoRef = useRef<HTMLVideoElement | null>(null);
  const scannerStopRef = useRef<(() => void) | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);

  const skuValue = useMemo(() => Number(form.sku), [form.sku]);
  const priceValue = useMemo(() => Number(form.price), [form.price]);
  const initialQtyValue = useMemo(() => Number(form.initialQty), [form.initialQty]);

  const selectedWarehouseName = useMemo(
    () => warehouses.find((warehouse) => warehouse.id === form.initialWarehouseId)?.name,
    [form.initialWarehouseId, warehouses],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.body.style.overflow = "hidden";

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        scannerStopRef.current?.();
        scannerStopRef.current = null;
        scannerControlsRef.current = null;
        setIsScannerOpen(false);
        setIsScannerBooting(false);
        setIsTorchAvailable(false);
        setIsTorchOn(false);
        setIsTorchLoading(false);
        setScannerError(null);
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isScannerOpen) {
      scannerStopRef.current?.();
      scannerStopRef.current = null;
      scannerControlsRef.current = null;
      setIsScannerBooting(false);
      setIsTorchAvailable(false);
      setIsTorchOn(false);
      setIsTorchLoading(false);
      return;
    }

    let cancelled = false;
    const ignoredErrorNames = new Set([
      "NotFoundException",
      "ChecksumException",
      "FormatException",
    ]);

    const startScanner = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setIsScannerBooting(false);
        setScannerError("Este navegador no permite abrir la camara desde esta vista.");
        return;
      }

      const videoElement = scannerVideoRef.current;

      if (!videoElement) {
        setIsScannerBooting(false);
        setScannerError("No se pudo iniciar el escaner. Intenta nuevamente.");
        return;
      }

      setIsScannerBooting(true);
      setScannerError(null);

      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");

        if (cancelled) {
          return;
        }

        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: {
                ideal: "environment",
              },
            },
          },
          videoElement,
          (result, error) => {
            if (result) {
              const digitsOnly = result.getText().replace(/\D/g, "");

              if (!digitsOnly) {
                setScannerError("Se detecto un codigo sin digitos validos.");
                return;
              }

              updateForm("sku", digitsOnly);
              setScannerError(null);
              controls.stop();
              scannerStopRef.current = null;
              scannerControlsRef.current = null;
              setIsScannerBooting(false);
              setIsTorchAvailable(false);
              setIsTorchOn(false);
              setIsTorchLoading(false);
              setIsScannerOpen(false);

              if (typeof navigator !== "undefined" && "vibrate" in navigator) {
                navigator.vibrate(60);
              }

              return;
            }

            if (!error) {
              return;
            }

            const errorName = (error as { name?: string }).name;

            if (errorName && ignoredErrorNames.has(errorName)) {
              return;
            }

            setScannerError((current) =>
              current ?? "No se pudo leer el codigo. Ajusta enfoque e intenta de nuevo.",
            );
          },
        );

        if (cancelled) {
          controls.stop();
          return;
        }

        scannerStopRef.current = () => {
          controls.stop();
        };
        scannerControlsRef.current = controls;
        setIsTorchAvailable(typeof controls.switchTorch === "function");
        setIsTorchOn(false);
        setIsTorchLoading(false);
        setIsScannerBooting(false);
      } catch {
        if (cancelled) {
          return;
        }

        setIsScannerBooting(false);
        setIsTorchAvailable(false);
        setIsTorchOn(false);
        setIsTorchLoading(false);
        setScannerError("No se pudo abrir la camara. Revisa permisos e intenta otra vez.");
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      scannerStopRef.current?.();
      scannerStopRef.current = null;
      scannerControlsRef.current = null;
    };
  }, [isScannerOpen]);

  const updateForm = <K extends keyof ProductWizardForm>(
    field: K,
    value: ProductWizardForm[K],
  ) => {
    setStepError(null);

    setForm((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };

      if (field === "initialQty") {
        const qty = Number(value);

        if (!Number.isFinite(qty) || qty <= 0) {
          next.initialWarehouseId = "";
        }
      }

      return next;
    });
  };

  const validateBaseData = (): string | null => {
    if (!Number.isInteger(skuValue) || skuValue <= 0) {
      return "El SKU debe ser un numero entero positivo.";
    }

    if (!form.name.trim()) {
      return "El nombre del producto es obligatorio.";
    }

    if (!Number.isFinite(priceValue) || priceValue < 0) {
      return "El precio debe ser mayor o igual a 0.";
    }

    return null;
  };

  const validateStep = (targetStep: number): string | null => {
    if (targetStep >= 2) {
      const baseError = validateBaseData();

      if (baseError) {
        return baseError;
      }
    }

    if (targetStep >= 3) {
      if (!Number.isInteger(initialQtyValue) || initialQtyValue < 0) {
        return "El stock inicial debe ser un numero entero mayor o igual a 0.";
      }

      if (initialQtyValue > 0 && !form.initialWarehouseId) {
        return "Selecciona un almacen para asignar el stock inicial.";
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

    const nextStep = Math.min(step + 1, 3);
    setStepError(null);
    setStep(nextStep);

    if (nextStep === 3) {
      lastStepEnteredAtRef.current = Date.now();
    }
  };

  const handlePrev = () => {
    setStepError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const openModal = () => {
    scannerStopRef.current?.();
    scannerStopRef.current = null;
    scannerControlsRef.current = null;
    setStep(1);
    setStepError(null);
    setApiError(null);
    setForm(getDefaultForm());
    setIsScannerOpen(false);
    setIsScannerBooting(false);
    setIsTorchAvailable(false);
    setIsTorchOn(false);
    setIsTorchLoading(false);
    setScannerError(null);
    lastStepEnteredAtRef.current = 0;
    setIsOpen(true);
  };

  const closeModal = () => {
    scannerStopRef.current?.();
    scannerStopRef.current = null;
    scannerControlsRef.current = null;
    setIsScannerOpen(false);
    setIsScannerBooting(false);
    setIsTorchAvailable(false);
    setIsTorchOn(false);
    setIsTorchLoading(false);
    setScannerError(null);
    setIsOpen(false);
    setStepError(null);
    setApiError(null);
  };

  const openScanner = () => {
    setIsTorchAvailable(false);
    setIsTorchOn(false);
    setIsTorchLoading(false);
    setScannerError(null);
    setIsScannerOpen(true);
  };

  const closeScanner = () => {
    scannerStopRef.current?.();
    scannerStopRef.current = null;
    scannerControlsRef.current = null;
    setIsScannerOpen(false);
    setIsScannerBooting(false);
    setIsTorchAvailable(false);
    setIsTorchOn(false);
    setIsTorchLoading(false);
    setScannerError(null);
  };

  const toggleTorch = async () => {
    if (isTorchLoading) {
      return;
    }

    const controls = scannerControlsRef.current;

    if (!controls?.switchTorch) {
      return;
    }

    const nextTorchState = !isTorchOn;

    setIsTorchLoading(true);
    setScannerError(null);

    try {
      await controls.switchTorch(nextTorchState);
      setIsTorchOn(nextTorchState);
    } catch {
      setIsTorchAvailable(false);
      setIsTorchOn(false);
      setScannerError("Tu dispositivo no permite controlar el flash desde el navegador.");
    } finally {
      setIsTorchLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step < 3) return;

    if (Date.now() - lastStepEnteredAtRef.current < 450) return;

    const error = validateStep(3);
    if (error) {
      setStepError(error);

      if (error.includes("SKU") || error.includes("nombre") || error.includes("precio")) {
        setStep(1);
      } else {
        setStep(2);
      }
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: skuValue,
          name: form.name,
          price: priceValue,
          initialQty: initialQtyValue,
          initialWarehouseId: form.initialWarehouseId || undefined,
        }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setApiError(data.error ?? "No fue posible crear el producto.");
        return;
      }

      closeModal();
      router.refresh();
    } catch {
      setApiError("Error de conexion. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
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

    if (step < 3) {
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
            Nuevo producto
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
                className="wizard-panel relative z-10 flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.35rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_40px_60px_-36px_rgba(15,23,42,0.78)] sm:max-h-[90dvh] sm:rounded-[1.5rem]"
                role="dialog"
                aria-modal="true"
                aria-label="Crear producto"
              >
                <div className="shrink-0 border-b border-[var(--border)] px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="pill-label">Asistente</p>
                      <h3 className="mt-2 text-[1.42rem] leading-none text-[var(--foreground)]">
                        Crear producto
                      </h3>
                    </div>

                    <button type="button" className="action-btn action-btn-soft" onClick={closeModal}>
                      Cerrar
                    </button>
                  </div>

                  <ol className="mt-4 grid grid-cols-3 gap-2">
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
                  onSubmit={handleSubmit}
                  onKeyDown={handleFormKeyDown}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                    {apiError ? (
                      <div className="mb-4 rounded-xl border border-[color:rgba(217,45,32,0.28)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger-text)]">
                        {apiError}
                      </div>
                    ) : null}

                    {stepError ? (
                      <div className="mb-4 rounded-xl border border-[color:rgba(47,138,119,0.34)] bg-[color:rgba(47,138,119,0.12)] px-3 py-2 text-sm text-[var(--primary)]">
                        {stepError}
                      </div>
                    ) : null}

                    {step === 1 ? (
                      <section className="app-enter grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">SKU</span>
                          <div className="flex items-center gap-2">
                            <input
                              value={form.sku}
                              onChange={(event) => updateForm("sku", event.target.value)}
                              type="number"
                              min={1}
                              step={1}
                              className="form-input"
                              placeholder="1003"
                            />

                            <button
                              type="button"
                              onClick={openScanner}
                              className="action-btn action-btn-soft px-3 sm:hidden"
                              aria-label="Escanear codigo de barras"
                            >
                              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
                                <rect
                                  x="3.5"
                                  y="6"
                                  width="17"
                                  height="13"
                                  rx="2"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                />
                                <path
                                  d="M8.5 6V4.8A1.3 1.3 0 0 1 9.8 3.5h4.4a1.3 1.3 0 0 1 1.3 1.3V6"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                />
                                <circle cx="12" cy="12.5" r="2.6" stroke="currentColor" strokeWidth="1.7" />
                              </svg>
                            </button>
                          </div>

                          <p className="mt-1 text-[11px] text-[var(--ink-soft)] sm:hidden">
                            Escanea un codigo para autocompletar el SKU.
                          </p>
                        </label>

                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                            Precio
                          </span>
                          <input
                            value={form.price}
                            onChange={(event) => updateForm("price", event.target.value)}
                            type="number"
                            min={0}
                            step="0.01"
                            className="form-input"
                            placeholder="6.75"
                          />
                        </label>

                        <label className="block sm:col-span-2">
                          <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                            Nombre
                          </span>
                          <input
                            value={form.name}
                            onChange={(event) => updateForm("name", event.target.value)}
                            type="text"
                            className="form-input"
                            placeholder="Amoxicilina 500mg"
                          />
                        </label>
                      </section>
                    ) : null}

                    {step === 2 ? (
                      <section className="app-enter grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                            Stock inicial
                          </span>
                          <input
                            value={form.initialQty}
                            onChange={(event) => updateForm("initialQty", event.target.value)}
                            type="number"
                            min={0}
                            step={1}
                            className="form-input"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                            Almacen inicial
                          </span>
                          <select
                            value={form.initialWarehouseId}
                            onChange={(event) => updateForm("initialWarehouseId", event.target.value)}
                            className="form-input"
                            disabled={initialQtyValue <= 0}
                          >
                            <option value="">Sin stock inicial</option>
                            {warehouses.map((warehouse) => (
                              <option key={warehouse.id} value={warehouse.id}>
                                {warehouse.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div className="panel-soft rounded-xl px-3 py-2 text-xs text-[var(--ink-soft)] sm:col-span-2">
                          {initialQtyValue > 0
                            ? "Al asignar stock inicial debes elegir un almacen destino."
                            : "Si no deseas stock inicial, deja la cantidad en 0."}
                        </div>
                      </section>
                    ) : null}

                    {step === 3 ? (
                      <section className="app-enter space-y-4">
                        <div className="panel-soft rounded-2xl px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
                            Resumen
                          </p>
                          <div className="mt-2 grid gap-3 text-sm sm:grid-cols-2">
                            <p className="text-[var(--ink-soft)]">
                              SKU: <span className="font-semibold text-[var(--foreground)]">{form.sku || "-"}</span>
                            </p>
                            <p className="text-[var(--ink-soft)]">
                              Precio:{" "}
                              <span className="font-semibold text-[var(--foreground)]">{form.price || "-"}</span>
                            </p>
                            <p className="text-[var(--ink-soft)] sm:col-span-2">
                              Nombre:{" "}
                              <span className="font-semibold text-[var(--foreground)]">{form.name || "-"}</span>
                            </p>
                            <p className="text-[var(--ink-soft)]">
                              Stock inicial:{" "}
                              <span className="font-semibold text-[var(--foreground)]">
                                {form.initialQty || "0"}
                              </span>
                            </p>
                            <p className="text-[var(--ink-soft)]">
                              Almacen:{" "}
                              <span className="font-semibold text-[var(--foreground)]">
                                {selectedWarehouseName ?? "Sin asignar"}
                              </span>
                            </p>
                          </div>
                        </div>
                      </section>
                    ) : null}
                  </div>

                  <div className="shrink-0 border-t border-[var(--border-light)] px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-[var(--ink-soft)]">
                        Paso {step} de 3 - alta de producto asistida.
                      </p>

                      <div className="flex items-center gap-2">
                        {step > 1 ? (
                          <button
                            type="button"
                            className="action-btn action-btn-soft"
                            onClick={handlePrev}
                          >
                            Anterior
                          </button>
                        ) : null}

                        {step < 3 ? (
                          <button
                            type="button"
                            className="action-btn action-btn-primary"
                            onClick={handleNext}
                          >
                            Siguiente
                          </button>
                        ) : (
                          <button
                            type="submit"
                            className="action-btn action-btn-primary"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Guardando..." : "Guardar producto"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {isScannerOpen ? (
                <div className="absolute inset-0 z-20 flex items-end justify-center bg-[color:rgba(2,6,23,0.76)] p-3 sm:hidden">
                  <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_30px_60px_-30px_rgba(2,6,23,0.8)]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--foreground)]">Escanear codigo de barras</p>
                      <div className="flex items-center gap-2">
                        {isTorchAvailable ? (
                          <button
                            type="button"
                            className={`action-btn ${isTorchOn ? "action-btn-primary" : "action-btn-soft"}`}
                            onClick={toggleTorch}
                            disabled={isTorchLoading || isScannerBooting}
                          >
                            {isTorchLoading ? "Flash..." : isTorchOn ? "Apagar flash" : "Encender flash"}
                          </button>
                        ) : null}

                        <button
                          type="button"
                          className="action-btn action-btn-soft"
                          onClick={closeScanner}
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[color:#05070c]">
                      <div className="relative">
                        <video
                          ref={scannerVideoRef}
                          className="h-64 w-full object-cover"
                          autoPlay
                          muted
                          playsInline
                        />
                        <div className="pointer-events-none absolute inset-x-6 top-1/2 h-14 -translate-y-1/2 rounded-lg border-2 border-[color:rgba(47,138,119,0.82)] shadow-[0_0_0_120px_rgba(2,6,23,0.26)]" />
                      </div>
                    </div>

                    {isScannerBooting ? (
                      <p className="mt-2 text-xs text-[var(--ink-soft)]">Iniciando camara...</p>
                    ) : scannerError ? (
                      <p className="mt-2 text-xs text-[var(--danger-text)]">{scannerError}</p>
                    ) : (
                      <p className="mt-2 text-xs text-[var(--ink-soft)]">
                        Alinea el codigo dentro del marco. El SKU se completa automaticamente.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
