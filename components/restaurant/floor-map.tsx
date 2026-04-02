"use client";

import { useState, useCallback, useEffect } from "react";
import type { TableWithStatus, TableSection, Order } from "@/lib/types";
import { OrderPanel } from "./order-panel";

type Props = {
  initialTables: TableWithStatus[];
  sections: TableSection[];
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);
}

function TableShape({ table, onClick }: { table: TableWithStatus; onClick: () => void }) {
  const isOccupied = table.status === "occupied";
  const isAvailable = table.status === "available";

  const borderColor = isOccupied
    ? "rgba(239,68,68,0.6)"
    : isAvailable
    ? "rgba(34,197,94,0.4)"
    : "rgba(245,158,11,0.4)";

  const bgColor = isOccupied
    ? "rgba(239,68,68,0.08)"
    : isAvailable
    ? "rgba(34,197,94,0.06)"
    : "rgba(245,158,11,0.08)";

  const dotColor = isOccupied ? "#ef4444" : isAvailable ? "#22c55e" : "#f59e0b";
  const isRound = table.shape === "round";
  const borderRadius = isRound ? "50%" : "10px";

  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        left: table.posX,
        top: table.posY,
        width: table.width,
        height: table.height,
        transform: `rotate(${table.rotation}deg)`,
        border: `1.5px solid ${borderColor}`,
        background: bgColor,
        borderRadius,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transition: "box-shadow 0.2s, border-color 0.2s",
        userSelect: "none",
      }}
      className="group hover:shadow-lg"
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = isOccupied ? "#ef4444" : "#22c55e";
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 3px ${borderColor.replace("0.6", "0.2").replace("0.4", "0.15")}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = borderColor;
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Status dot */}
      <div
        style={{
          position: "absolute",
          top: 6,
          right: 8,
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: dotColor,
          boxShadow: `0 0 6px ${dotColor}`,
        }}
        className={isOccupied ? "pulse-dot" : ""}
      />

      {/* Seats indicator (top) */}
      <div
        style={{
          position: "absolute",
          top: -1,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 3,
        }}
      >
        {Array.from({ length: Math.min(Math.ceil(table.seats / 2), 4) }).map((_, i) => (
          <div key={i} style={{ width: 8, height: 5, borderRadius: "4px 4px 0 0", background: borderColor, marginTop: -4 }} />
        ))}
      </div>

      {/* Table number */}
      <span style={{ fontSize: 16, fontWeight: 700, color: isOccupied ? "#ef4444" : isAvailable ? "#22c55e" : "#f59e0b", lineHeight: 1 }}>
        {table.number}
      </span>
      {table.name && (
        <span style={{ fontSize: 9, color: "#6b7a94", marginTop: 1, letterSpacing: "0.05em" }}>{table.name}</span>
      )}

      {/* Order info */}
      {table.activeOrder && (
        <div style={{ marginTop: 4, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#f59e0b" }}>{fmt(table.activeOrder.total)}</div>
          <div style={{ fontSize: 9, color: "#6b7a94" }}>{table.activeOrder.minutesOpen}min · {table.activeOrder.guestCount}px</div>
        </div>
      )}

      {/* Seats count */}
      <div style={{ position: "absolute", bottom: 5, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: "#6b7a94", whiteSpace: "nowrap" }}>
        {table.seats} <span style={{ opacity: 0.7 }}>lugares</span>
      </div>
    </div>
  );
}

export function FloorMap({ initialTables, sections }: Props) {
  const [tables, setTables] = useState<TableWithStatus[]>(initialTables);
  const [selectedTable, setSelectedTable] = useState<TableWithStatus | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refreshTables = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/restaurant/tables");
      if (res.ok) {
        const data = await res.json();
        setTables(data.tables);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(refreshTables, 30000);
    return () => clearInterval(t);
  }, [refreshTables]);

  async function handleTableClick(table: TableWithStatus) {
    setSelectedTable(table);
    setLoadingOrder(true);
    setActiveOrder(null);
    try {
      if (table.activeOrder) {
        const res = await fetch(`/api/restaurant/orders/${table.activeOrder.id}`);
        if (res.ok) {
          const data = await res.json();
          setActiveOrder(data.order);
        }
      }
    } finally {
      setLoadingOrder(false);
    }
  }

  function handleClosePanel() {
    setSelectedTable(null);
    setActiveOrder(null);
    refreshTables();
  }

  function handleOrderUpdate(order: Order) {
    setActiveOrder(order);
    // Update table status
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== order.tableId) return t;
        if (order.status === "paid" || order.status === "cancelled") {
          return { ...t, status: "available", activeOrder: null };
        }
        return {
          ...t,
          status: "occupied" as const,
          activeOrder: {
            id: order.id,
            guestCount: order.guestCount,
            total: order.total,
            itemCount: order.items.reduce((s, i) => s + i.quantity, 0),
            openedAt: order.createdAt,
            openedByName: order.openedByName,
            minutesOpen: Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000),
          },
        };
      })
    );
    if (order.status === "paid" || order.status === "cancelled") {
      setSelectedTable(null);
      setActiveOrder(null);
    }
  }

  const filteredTables = activeSection ? tables.filter((t) => t.sectionId === activeSection) : tables;

  const stats = {
    total: tables.length,
    occupied: tables.filter((t) => t.status === "occupied").length,
    available: tables.filter((t) => t.status === "available").length,
  };

  return (
    <div className="flex h-full flex-col" style={{ background: "#0d0f14" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-[#1e2433] px-6 py-3">
        <div className="flex items-center gap-6">
          <h1 className="text-base font-bold text-white">Mesas del Restaurante</h1>
          {/* Quick stats */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-[#6b7a94]">{stats.available} libres</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-red-500 pulse-dot" />
              <span className="text-[#6b7a94]">{stats.occupied} ocupadas</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#6b7a94]">
              <span>{stats.total} total</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Section filters */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveSection(null)}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                !activeSection ? "bg-amber-500/15 text-amber-400" : "text-[#6b7a94] hover:text-white",
              ].join(" ")}
            >
              Todas
            </button>
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(activeSection === sec.id ? null : sec.id)}
                className={[
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  activeSection === sec.id ? "text-white" : "text-[#6b7a94] hover:text-white",
                ].join(" ")}
                style={activeSection === sec.id ? { background: sec.color + "22", color: sec.color } : {}}
              >
                {sec.name}
              </button>
            ))}
          </div>

          <button
            onClick={refreshTables}
            disabled={refreshing}
            className="rounded-lg border border-[#1e2433] p-2 text-[#6b7a94] hover:text-white hover:border-[#353c50] transition-colors"
            title="Actualizar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={refreshing ? "spin" : ""}>
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Floor canvas */}
      <div className="flex-1 overflow-auto p-4">
        <div style={{ position: "relative", minWidth: 1000, minHeight: 680 }}>
          {/* Section labels */}
          {sections.map((sec) => {
            const sectionTables = tables.filter((t) => t.sectionId === sec.id);
            if (!sectionTables.length) return null;
            const minX = Math.min(...sectionTables.map((t) => t.posX)) - 20;
            const minY = Math.min(...sectionTables.map((t) => t.posY)) - 32;
            return (
              <div
                key={sec.id}
                style={{ position: "absolute", left: minX, top: minY, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: sec.color, opacity: 0.7 }}
              >
                {sec.name}
              </div>
            );
          })}

          {filteredTables.map((table) => (
            <TableShape key={table.id} table={table} onClick={() => handleTableClick(table)} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 border-t border-[#1e2433] px-6 py-2 text-xs text-[#6b7a94]">
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm border border-green-500/40 bg-green-500/10" /><span>Disponible</span></div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm border border-red-500/60 bg-red-500/10" /><span>Ocupada</span></div>
        <div className="ml-auto text-[10px]">Haz clic en una mesa para abrir o ver la orden</div>
      </div>

      {/* Order Panel */}
      {selectedTable && (
        <OrderPanel
          table={selectedTable}
          order={activeOrder}
          loading={loadingOrder}
          onClose={handleClosePanel}
          onOrderUpdate={handleOrderUpdate}
        />
      )}
    </div>
  );
}
