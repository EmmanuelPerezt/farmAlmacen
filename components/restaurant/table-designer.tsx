"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { TableWithStatus, TableSection, TableShape } from "@/lib/types";

type Props = {
  initialTables: TableWithStatus[];
  sections: TableSection[];
};

type DragState = {
  tableId: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
} | null;

type ResizeState = {
  tableId: string;
  startX: number;
  startY: number;
  origW: number;
  origH: number;
} | null;

type LocalTable = TableWithStatus & { dirty?: boolean };

const GRID = 20;
function snap(v: number) { return Math.round(v / GRID) * GRID; }

function fmt(n: number) { return `${n}px`; }

const SHAPES: { value: TableShape; label: string }[] = [
  { value: "square", label: "Cuadrada" },
  { value: "round", label: "Redonda" },
  { value: "rectangle", label: "Rectangular" },
];

export function TableDesigner({ initialTables, sections }: Props) {
  const [tables, setTables] = useState<LocalTable[]>(initialTables);
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState>(null);
  const [resize, setResize] = useState<ResizeState>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [newTable, setNewTable] = useState({ number: "", seats: 4, shape: "square" as TableShape, sectionId: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedTable = tables.find((t) => t.id === selected);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (drag) {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      setTables((prev) => prev.map((t) => {
        if (t.id !== drag.tableId) return t;
        return { ...t, posX: snap(drag.origX + dx), posY: snap(drag.origY + dy), dirty: true };
      }));
    }
    if (resize) {
      const dx = e.clientX - resize.startX;
      const dy = e.clientY - resize.startY;
      setTables((prev) => prev.map((t) => {
        if (t.id !== resize.tableId) return t;
        return { ...t, width: Math.max(80, snap(resize.origW + dx)), height: Math.max(80, snap(resize.origH + dy)), dirty: true };
      }));
    }
  }, [drag, resize]);

  const onMouseUp = useCallback(() => {
    setDrag(null);
    setResize(null);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  async function saveLayout() {
    setSaving(true);
    try {
      const dirtyTables = tables.filter((t) => t.dirty);
      if (!dirtyTables.length) { setSaved(true); setTimeout(() => setSaved(false), 2000); return; }
      await fetch("/api/restaurant/tables/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: dirtyTables.map((t) => ({ id: t.id, posX: t.posX, posY: t.posY, width: t.width, height: t.height, rotation: t.rotation })),
        }),
      });
      setTables((prev) => prev.map((t) => ({ ...t, dirty: false })));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function addTable() {
    if (!newTable.number) return;
    const canvas = canvasRef.current?.getBoundingClientRect();
    const posX = snap(100 + Math.random() * 200);
    const posY = snap(100 + Math.random() * 200);
    const res = await fetch("/api/restaurant/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        number: parseInt(newTable.number),
        seats: newTable.seats,
        shape: newTable.shape,
        sectionId: newTable.sectionId || undefined,
        posX, posY,
        width: newTable.shape === "rectangle" ? 180 : 110,
        height: 110,
      }),
    });
    const data = await res.json();
    if (data.table) {
      setTables((prev) => [...prev, { ...data.table, status: "available", activeOrder: null }]);
      setShowAddForm(false);
      setNewTable({ number: "", seats: 4, shape: "square", sectionId: "" });
    }
  }

  async function deleteTable(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/restaurant/tables/${id}`, { method: "DELETE" });
      setTables((prev) => prev.filter((t) => t.id !== id));
      if (selected === id) setSelected(null);
    } finally {
      setDeleting(null);
    }
  }

  async function updateSelectedProp(key: string, value: unknown) {
    if (!selected) return;
    setTables((prev) => prev.map((t) => t.id === selected ? { ...t, [key]: value, dirty: true } : t));
    await fetch(`/api/restaurant/tables/${selected}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
  }

  const hasDirty = tables.some((t) => t.dirty);

  return (
    <div className="flex h-full" style={{ background: "#0d0f14" }}>
      {/* Left panel - tools */}
      <div className="flex w-60 flex-col border-r border-[#1e2433]" style={{ background: "#13161d" }}>
        <div className="border-b border-[#1e2433] p-4">
          <h1 className="font-bold text-white">Diseño de Planta</h1>
          <p className="mt-0.5 text-xs text-[#6b7a94]">Arrastra las mesas para reposicionarlas</p>
        </div>

        {/* Add table */}
        <div className="p-3 border-b border-[#1e2433]">
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="action-btn action-btn-primary w-full justify-center text-xs"
          >
            + Añadir mesa
          </button>
          {showAddForm && (
            <div className="mt-3 space-y-3 rounded-xl border border-[#1e2433] bg-[#1a1e28] p-3">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#6b7a94]">Número</label>
                <input
                  type="number"
                  value={newTable.number}
                  onChange={(e) => setNewTable((n) => ({ ...n, number: e.target.value }))}
                  placeholder="18"
                  className="form-input text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#6b7a94]">Forma</label>
                <select value={newTable.shape} onChange={(e) => setNewTable((n) => ({ ...n, shape: e.target.value as TableShape }))} className="form-input text-sm">
                  {SHAPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#6b7a94]">Lugares: {newTable.seats}</label>
                <input type="range" min={1} max={20} value={newTable.seats} onChange={(e) => setNewTable((n) => ({ ...n, seats: parseInt(e.target.value) }))} className="w-full" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#6b7a94]">Sección</label>
                <select value={newTable.sectionId} onChange={(e) => setNewTable((n) => ({ ...n, sectionId: e.target.value }))} className="form-input text-sm">
                  <option value="">Sin sección</option>
                  {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={addTable} disabled={!newTable.number} className="action-btn action-btn-primary flex-1 justify-center text-xs">Crear</button>
                <button onClick={() => setShowAddForm(false)} className="action-btn action-btn-soft flex-1 justify-center text-xs">Cancelar</button>
              </div>
            </div>
          )}
        </div>

        {/* Selected table properties */}
        {selectedTable ? (
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">Mesa {selectedTable.number}</div>

            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#6b7a94]">Nombre (opcional)</label>
              <input
                defaultValue={selectedTable.name ?? ""}
                onBlur={(e) => updateSelectedProp("name", e.target.value || null)}
                placeholder="Ej: VIP 1"
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#6b7a94]">Forma</label>
              <select value={selectedTable.shape} onChange={(e) => updateSelectedProp("shape", e.target.value)} className="form-input text-xs">
                {SHAPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#6b7a94]">Lugares: {selectedTable.seats}</label>
              <input type="range" min={1} max={20} value={selectedTable.seats} onChange={(e) => updateSelectedProp("seats", parseInt(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#6b7a94]">Sección</label>
              <select value={selectedTable.sectionId ?? ""} onChange={(e) => updateSelectedProp("sectionId", e.target.value || null)} className="form-input text-xs">
                <option value="">Sin sección</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-[#6b7a94]">
              <div>X: {fmt(selectedTable.posX)}</div>
              <div>Y: {fmt(selectedTable.posY)}</div>
              <div>W: {fmt(selectedTable.width)}</div>
              <div>H: {fmt(selectedTable.height)}</div>
            </div>
            <button
              onClick={() => deleteTable(selectedTable.id)}
              disabled={!!deleting}
              className="action-btn action-btn-danger w-full justify-center text-xs"
            >
              {deleting === selectedTable.id ? "Eliminando..." : "Eliminar mesa"}
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4 text-center">
            <p className="text-xs text-[#6b7a94]">Selecciona una mesa para editar sus propiedades</p>
          </div>
        )}

        {/* Save */}
        <div className="border-t border-[#1e2433] p-3">
          <button
            onClick={saveLayout}
            disabled={saving || !hasDirty}
            className={["action-btn w-full justify-center text-xs", saved ? "action-btn-success" : hasDirty ? "action-btn-primary" : "action-btn-soft"].join(" ")}
          >
            {saving ? "Guardando..." : saved ? "✓ Guardado" : hasDirty ? "💾 Guardar posiciones" : "Sin cambios"}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex-1 overflow-auto p-6">
        {/* Grid background */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="designer-grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
              <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="#f59e0b" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#designer-grid)" />
        </svg>

        <div ref={canvasRef} style={{ position: "relative", minWidth: 1100, minHeight: 750 }}>
          {/* Section labels */}
          {sections.map((sec) => {
            const secTables = tables.filter((t) => t.sectionId === sec.id);
            if (!secTables.length) return null;
            const minX = Math.min(...secTables.map((t) => t.posX)) - 20;
            const minY = Math.min(...secTables.map((t) => t.posY)) - 30;
            return (
              <div
                key={sec.id}
                style={{ position: "absolute", left: minX, top: minY, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: sec.color, opacity: 0.8 }}
              >
                {sec.name}
              </div>
            );
          })}

          {tables.map((table) => {
            const isSelected = table.id === selected;
            const isRound = table.shape === "round";
            const borderRadius = isRound ? "50%" : "10px";
            const borderColor = isSelected ? "#f59e0b" : table.sectionColor ? table.sectionColor + "40" : "#1e2433";
            const bg = isSelected ? "rgba(245,158,11,0.08)" : table.sectionColor ? table.sectionColor + "0a" : "#1a1e28";

            return (
              <div
                key={table.id}
                style={{
                  position: "absolute",
                  left: table.posX,
                  top: table.posY,
                  width: table.width,
                  height: table.height,
                  borderRadius,
                  border: `2px solid ${borderColor}`,
                  background: bg,
                  cursor: drag?.tableId === table.id ? "grabbing" : "grab",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  userSelect: "none",
                  boxShadow: isSelected ? "0 0 0 3px rgba(245,158,11,0.2)" : "none",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onMouseDown={(e) => {
                  if ((e.target as HTMLElement).closest(".resize-handle")) return;
                  e.preventDefault();
                  setSelected(table.id);
                  setDrag({ tableId: table.id, startX: e.clientX, startY: e.clientY, origX: table.posX, origY: table.posY });
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: isSelected ? "#f59e0b" : "#f1f0ec" }}>
                  {table.number}
                </span>
                {table.name && <span style={{ fontSize: 8, color: "#6b7a94", marginTop: 1 }}>{table.name}</span>}
                <span style={{ fontSize: 9, color: "#6b7a94", marginTop: 2 }}>{table.seats}px · {table.shape === "round" ? "⬤" : table.shape === "rectangle" ? "▬" : "■"}</span>

                {/* Resize handle */}
                {isSelected && (
                  <div
                    className="resize-handle"
                    style={{
                      position: "absolute",
                      right: -4,
                      bottom: -4,
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: "#f59e0b",
                      cursor: "se-resize",
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setResize({ tableId: table.id, startX: e.clientX, startY: e.clientY, origW: table.width, origH: table.height });
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
