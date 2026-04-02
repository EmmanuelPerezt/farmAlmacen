"use client";

import { useState } from "react";
import type { MenuCategory, MenuItem, Session } from "@/lib/types";

type Props = {
  categories: MenuCategory[];
  items: MenuItem[];
  session: Session;
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 }).format(n);
}

type ItemForm = { name: string; description: string; price: string; categoryId: string };
const EMPTY_FORM: ItemForm = { name: "", description: "", price: "", categoryId: "" };

export function MenuManager({ categories: initCats, items: initItems, session }: Props) {
  const [categories, setCategories] = useState<MenuCategory[]>(initCats);
  const [items, setItems] = useState<MenuItem[]>(initItems);
  const [activeCategory, setActiveCategory] = useState<string | null>(initCats[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [showItemForm, setShowItemForm] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>(EMPTY_FORM);
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", emoji: "🍽️" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isAdmin = session.role === "admin";

  const filteredItems = items.filter((item) => {
    const matchCat = !activeCategory || item.categoryId === activeCategory;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function openAddItem() {
    setEditItem(null);
    setItemForm({ ...EMPTY_FORM, categoryId: activeCategory ?? "" });
    setShowItemForm(true);
    setError("");
  }

  function openEditItem(item: MenuItem) {
    setEditItem(item);
    setItemForm({ name: item.name, description: item.description, price: String(item.price), categoryId: item.categoryId });
    setShowItemForm(true);
    setError("");
  }

  async function saveItem() {
    if (!itemForm.name || !itemForm.price || !itemForm.categoryId) { setError("Completa todos los campos requeridos"); return; }
    setSaving(true);
    setError("");
    try {
      const url = editItem ? `/api/restaurant/menu/items/${editItem.id}` : "/api/restaurant/menu/items";
      const method = editItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: itemForm.name, description: itemForm.description, price: parseFloat(itemForm.price), categoryId: itemForm.categoryId }),
      });
      const data = await res.json();
      if (data.item) {
        if (editItem) setItems((prev) => prev.map((i) => i.id === editItem.id ? data.item : i));
        else setItems((prev) => [...prev, data.item]);
        setShowItemForm(false);
        setItemForm(EMPTY_FORM);
        setEditItem(null);
      } else {
        setError(data.error ?? "Error al guardar");
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailable(item: MenuItem) {
    const res = await fetch(`/api/restaurant/menu/items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !item.available }),
    });
    const data = await res.json();
    if (data.item) setItems((prev) => prev.map((i) => i.id === item.id ? data.item : i));
  }

  async function deleteItem(item: MenuItem) {
    if (!confirm(`¿Eliminar "${item.name}"?`)) return;
    await fetch(`/api/restaurant/menu/items/${item.id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  async function saveCategory() {
    if (!catForm.name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/restaurant/menu/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catForm),
      });
      const data = await res.json();
      if (data.category) {
        setCategories((prev) => [...prev, data.category]);
        setActiveCategory(data.category.id);
        setShowCatForm(false);
        setCatForm({ name: "", emoji: "🍽️" });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full" style={{ background: "#0d0f14" }}>
      {/* Sidebar - categories */}
      <div className="flex w-56 flex-col border-r border-[#1e2433]" style={{ background: "#13161d" }}>
        <div className="border-b border-[#1e2433] p-4">
          <h1 className="font-bold text-white">Menú</h1>
          <p className="mt-0.5 text-xs text-[#6b7a94]">{items.length} platillos</p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {categories.map((cat) => {
            const count = items.filter((i) => i.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setSearch(""); }}
                className={[
                  "flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium transition-all",
                  activeCategory === cat.id
                    ? "bg-amber-500/10 text-amber-400 border-l-2 border-amber-400"
                    : "text-[#6b7a94] hover:text-white hover:bg-white/5",
                ].join(" ")}
              >
                <span>{cat.emoji} {cat.name}</span>
                <span className="text-xs opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        {isAdmin && (
          <div className="border-t border-[#1e2433] p-3">
            {showCatForm ? (
              <div className="space-y-2">
                <input value={catForm.emoji} onChange={(e) => setCatForm((f) => ({ ...f, emoji: e.target.value }))} placeholder="🍽️" className="form-input text-sm w-14" />
                <input value={catForm.name} onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nombre categoría" className="form-input text-sm" autoFocus />
                <div className="flex gap-1">
                  <button onClick={saveCategory} className="action-btn action-btn-primary flex-1 justify-center text-xs">Crear</button>
                  <button onClick={() => setShowCatForm(false)} className="action-btn action-btn-soft flex-1 justify-center text-xs">✕</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowCatForm(true)} className="action-btn action-btn-soft w-full justify-center text-xs">+ Categoría</button>
            )}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-[#1e2433] px-6 py-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar platillo..."
            className="form-input w-64 text-sm"
          />
          <div className="flex-1" />
          {isAdmin && (
            <button onClick={openAddItem} className="action-btn action-btn-primary text-sm">
              + Añadir platillo
            </button>
          )}
        </div>

        {/* Items grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={[
                  "group relative rounded-2xl border p-4 transition-all",
                  item.available ? "border-[#1e2433] bg-[#13161d] hover:border-amber-500/20" : "border-[#1e2433] bg-[#13161d] opacity-50",
                ].join(" ")}
              >
                {!item.available && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 text-xs font-bold text-red-400">NO DISPONIBLE</div>
                )}

                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white leading-tight">{item.name}</div>
                    {item.description && <div className="mt-1 text-xs text-[#6b7a94] line-clamp-2">{item.description}</div>}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold text-amber-400">{fmt(item.price)}</span>
                  {isAdmin && (
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => toggleAvailable(item)} className="rounded-lg p-1.5 text-[#6b7a94] hover:text-amber-400 hover:bg-amber-400/10 transition-colors" title={item.available ? "Desactivar" : "Activar"}>
                        {item.available ? "🔒" : "🔓"}
                      </button>
                      <button onClick={() => openEditItem(item)} className="rounded-lg p-1.5 text-[#6b7a94] hover:text-white hover:bg-white/10 transition-colors" title="Editar">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => deleteItem(item)} className="rounded-lg p-1.5 text-[#6b7a94] hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Eliminar">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="col-span-full py-16 text-center text-[#6b7a94]">
                <div className="text-4xl mb-3">🍽️</div>
                <div>Sin platillos en esta categoría</div>
                {isAdmin && <button onClick={openAddItem} className="mt-3 text-sm text-amber-400 hover:text-amber-300">+ Añadir el primero</button>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item form modal */}
      {showItemForm && (
        <div className="wizard-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="wizard-panel w-full max-w-md rounded-2xl border border-[#1e2433] shadow-2xl" style={{ background: "#13161d" }}>
            <div className="flex items-center justify-between border-b border-[#1e2433] px-5 py-4">
              <h2 className="font-semibold text-white">{editItem ? "Editar platillo" : "Nuevo platillo"}</h2>
              <button onClick={() => setShowItemForm(false)} className="rounded-lg p-1.5 text-[#6b7a94] hover:text-white hover:bg-white/5 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#f1f0ec]">Nombre *</label>
                <input value={itemForm.name} onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))} className="form-input" placeholder="Filete Mignon" autoFocus />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#f1f0ec]">Descripción</label>
                <textarea value={itemForm.description} onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))} className="form-input h-16 resize-none" placeholder="Descripción del platillo..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#f1f0ec]">Precio *</label>
                  <input type="number" value={itemForm.price} onChange={(e) => setItemForm((f) => ({ ...f, price: e.target.value }))} className="form-input" placeholder="0.00" min={0} step={0.01} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#f1f0ec]">Categoría *</label>
                  <select value={itemForm.categoryId} onChange={(e) => setItemForm((f) => ({ ...f, categoryId: e.target.value }))} className="form-input">
                    <option value="">Seleccionar</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                  </select>
                </div>
              </div>
              {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{error}</div>}
              <div className="flex gap-2">
                <button onClick={saveItem} disabled={saving} className="action-btn action-btn-primary flex-1 justify-center">{saving ? "Guardando..." : "Guardar"}</button>
                <button onClick={() => setShowItemForm(false)} className="action-btn action-btn-soft flex-1 justify-center">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
