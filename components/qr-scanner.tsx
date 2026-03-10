"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { IScannerControls } from "@zxing/browser";

type QrScannerProps = {
  onScan: (text: string) => void;
  onClose: () => void;
  label?: string;
};

const ignoredErrorNames = new Set([
  "NotFoundException",
  "ChecksumException",
  "FormatException",
]);

export function QrScanner({ onScan, onClose, label = "Escanear codigo" }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [booting, setBooting] = useState(true);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchLoading, setTorchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setBooting(false);
        setError("Este navegador no permite abrir la camara.");
        return;
      }

      const videoElement = videoRef.current;
      if (!videoElement) {
        setBooting(false);
        setError("No se pudo iniciar el escaner.");
        return;
      }

      setBooting(true);
      setError(null);

      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled) return;

        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: { facingMode: { ideal: "environment" } },
          },
          videoElement,
          (result, err) => {
            if (result) {
              const text = result.getText();
              controls.stop();
              controlsRef.current = null;
              if (typeof navigator !== "undefined" && "vibrate" in navigator) {
                navigator.vibrate(60);
              }
              onScan(text);
              return;
            }
            if (!err) return;
            const errorName = (err as { name?: string }).name;
            if (errorName && ignoredErrorNames.has(errorName)) return;
            setError((c) => c ?? "No se pudo leer el codigo. Ajusta enfoque e intenta de nuevo.");
          },
        );

        if (cancelled) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        setTorchAvailable(typeof controls.switchTorch === "function");
        setBooting(false);
      } catch {
        if (cancelled) return;
        setBooting(false);
        setError("No se pudo abrir la camara. Revisa permisos e intenta otra vez.");
      }
    };

    start();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [onScan]);

  const toggleTorch = async () => {
    if (torchLoading) return;
    const controls = controlsRef.current;
    if (!controls?.switchTorch) return;

    setTorchLoading(true);
    setError(null);

    try {
      const next = !torchOn;
      await controls.switchTorch(next);
      setTorchOn(next);
    } catch {
      setTorchAvailable(false);
      setTorchOn(false);
      setError("Tu dispositivo no permite controlar el flash desde el navegador.");
    } finally {
      setTorchLoading(false);
    }
  };

  const handleClose = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    onClose();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[color:rgba(2,6,23,0.82)] p-3 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_30px_60px_-30px_rgba(2,6,23,0.8)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
          <div className="flex items-center gap-2">
            {torchAvailable ? (
              <button
                type="button"
                className={`action-btn text-xs ${torchOn ? "action-btn-primary" : "action-btn-soft"}`}
                onClick={toggleTorch}
                disabled={torchLoading || booting}
              >
                {torchLoading ? "Flash..." : torchOn ? "Apagar flash" : "Flash"}
              </button>
            ) : null}
            <button type="button" className="action-btn action-btn-soft text-xs" onClick={handleClose}>
              Cerrar
            </button>
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[color:#05070c]">
          <div className="relative">
            <video ref={videoRef} className="h-64 w-full object-cover" autoPlay muted playsInline />
            <div className="pointer-events-none absolute inset-x-6 top-1/2 h-14 -translate-y-1/2 rounded-lg border-2 border-[color:rgba(47,138,119,0.82)] shadow-[0_0_0_120px_rgba(2,6,23,0.26)]" />
          </div>
        </div>

        {booting ? (
          <p className="mt-2 text-xs text-[var(--ink-soft)]">Iniciando camara...</p>
        ) : error ? (
          <p className="mt-2 text-xs text-[var(--danger-text)]">{error}</p>
        ) : (
          <p className="mt-2 text-xs text-[var(--ink-soft)]">
            Alinea el codigo QR dentro del marco.
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
