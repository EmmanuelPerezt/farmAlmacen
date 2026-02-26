"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";

import type { Role } from "@/lib/types";

type UserCreateModalProps = {
  formError?: string;
};

type UserWizardForm = {
  username: string;
  password: string;
  displayName: string;
  role: Role;
};

const stepLabels = ["Datos", "Confirmar"];

function getDefaultForm(): UserWizardForm {
  return {
    username: "",
    password: "",
    displayName: "",
    role: "empleado",
  };
}

export function UserCreateModal({ formError }: UserCreateModalProps) {
  const [isOpen, setIsOpen] = useState(Boolean(formError));
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [form, setForm] = useState<UserWizardForm>(getDefaultForm);
  const lastStepEnteredAtRef = useRef(0);

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

  const updateForm = <K extends keyof UserWizardForm>(field: K, value: UserWizardForm[K]) => {
    setStepError(null);

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateStep = (targetStep: number): string | null => {
    if (targetStep >= 2) {
      if (!form.username.trim()) {
        return "El nombre de usuario es obligatorio.";
      }

      if (form.password.trim().length < 4) {
        return "La contrasena debe tener al menos 4 caracteres.";
      }

      if (!form.displayName.trim()) {
        return "El nombre visible es obligatorio.";
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

    const nextStep = Math.min(step + 1, 2);
    setStepError(null);
    setStep(nextStep);

    if (nextStep === 2) {
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
    if (step < 2) {
      event.preventDefault();
      return;
    }

    if (Date.now() - lastStepEnteredAtRef.current < 450) {
      event.preventDefault();
      return;
    }

    const error = validateStep(2);

    if (error) {
      event.preventDefault();
      setStepError(error);
      setStep(1);
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

    if (step < 2) {
      event.preventDefault();
      handleNext();
      return;
    }

    event.preventDefault();
  };

  return (
    <>
      <div className="panel app-enter app-enter-delay-1 rounded-[1.35rem] p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="pill-label">Alta guiada</p>
            <h3 className="mt-2 text-[1.4rem] leading-tight text-[var(--foreground)]">
              Crea usuarios con pasos claros
            </h3>
            <p className="mt-2 max-w-xl text-sm text-[var(--ink-soft)]">
              Configura credenciales y rol de acceso en un flujo simple para administradores.
            </p>
          </div>

          <button type="button" className="action-btn action-btn-primary" onClick={openModal}>
            Nuevo usuario
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--ink-soft)]">
          <span className="rounded-full border border-[color:rgba(31,99,85,0.3)] bg-[color:rgba(31,99,85,0.09)] px-3 py-1">
            Usuario y nombre obligatorios
          </span>
          <span className="rounded-full border border-[color:rgba(47,138,119,0.3)] bg-[color:rgba(47,138,119,0.09)] px-3 py-1">
            Contrasena minima de 4 caracteres
          </span>
        </div>
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
                className="wizard-panel relative z-10 flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.35rem] border border-[color:rgba(148,163,184,0.35)] bg-[color:rgba(255,255,255,0.98)] shadow-[0_40px_60px_-36px_rgba(15,23,42,0.78)] sm:max-h-[90dvh] sm:rounded-[1.5rem]"
                role="dialog"
                aria-modal="true"
                aria-label="Crear usuario"
              >
                <div className="shrink-0 border-b border-[color:rgba(148,163,184,0.3)] px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="pill-label">Asistente</p>
                      <h3 className="mt-2 text-[1.42rem] leading-none text-[var(--foreground)]">
                        Crear usuario
                      </h3>
                    </div>

                    <button type="button" className="action-btn action-btn-soft" onClick={closeModal}>
                      Cerrar
                    </button>
                  </div>

                  <ol className="mt-4 grid grid-cols-2 gap-2">
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
                                : "border-[color:rgba(148,163,184,0.28)] bg-[color:rgba(255,255,255,0.78)]"
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
                  action="/api/users"
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
                      <section className="app-enter grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                            Usuario
                          </span>
                          <input
                            value={form.username}
                            onChange={(event) => updateForm("username", event.target.value)}
                            type="text"
                            className="form-input"
                            placeholder="nuevo.usuario"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                            Contrasena
                          </span>
                          <input
                            value={form.password}
                            onChange={(event) => updateForm("password", event.target.value)}
                            type="password"
                            className="form-input"
                            placeholder="minimo 4 caracteres"
                          />
                        </label>

                        <label className="block sm:col-span-2">
                          <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                            Nombre visible
                          </span>
                          <input
                            value={form.displayName}
                            onChange={(event) => updateForm("displayName", event.target.value)}
                            type="text"
                            className="form-input"
                            placeholder="Ana Perez"
                          />
                        </label>

                        <label className="block sm:col-span-2">
                          <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                            Rol
                          </span>
                          <select
                            value={form.role}
                            onChange={(event) => updateForm("role", event.target.value as Role)}
                            className="form-input"
                          >
                            <option value="empleado">Empleado</option>
                            <option value="admin">Admin</option>
                          </select>
                        </label>
                      </section>
                    ) : null}

                    {step === 2 ? (
                      <section className="app-enter space-y-4">
                        <div className="panel-soft rounded-2xl px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
                            Resumen
                          </p>
                          <div className="mt-2 grid gap-3 text-sm sm:grid-cols-2">
                            <p className="text-[var(--ink-soft)]">
                              Usuario:{" "}
                              <span className="font-semibold text-[var(--foreground)]">
                                @{form.username || "-"}
                              </span>
                            </p>
                            <p className="text-[var(--ink-soft)]">
                              Rol:{" "}
                              <span className="font-semibold text-[var(--foreground)]">{form.role}</span>
                            </p>
                            <p className="text-[var(--ink-soft)] sm:col-span-2">
                              Nombre visible:{" "}
                              <span className="font-semibold text-[var(--foreground)]">
                                {form.displayName || "-"}
                              </span>
                            </p>
                            <p className="text-[var(--ink-soft)] sm:col-span-2">
                              Contrasena:{" "}
                              <span className="font-semibold text-[var(--foreground)]">
                                {form.password ? "*".repeat(form.password.length) : "-"}
                              </span>
                            </p>
                          </div>
                        </div>
                      </section>
                    ) : null}

                    <input type="hidden" name="username" value={form.username} />
                    <input type="hidden" name="password" value={form.password} />
                    <input type="hidden" name="displayName" value={form.displayName} />
                    <input type="hidden" name="role" value={form.role} />
                  </div>

                  <div className="shrink-0 border-t border-[color:rgba(148,163,184,0.24)] px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-[var(--ink-soft)]">
                        Paso {step} de 2 - alta de usuario asistida.
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

                        {step < 2 ? (
                          <button
                            type="button"
                            className="action-btn action-btn-primary"
                            onClick={handleNext}
                          >
                            Siguiente
                          </button>
                        ) : (
                          <button type="submit" className="action-btn action-btn-primary">
                            Crear usuario
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
