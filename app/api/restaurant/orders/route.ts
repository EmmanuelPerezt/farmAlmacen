import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { listOrders, createOrder, getActiveOrderForTable } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const tableId = url.searchParams.get("tableId") ?? undefined;
  const statuses = status ? status.split(",") : ["open", "billed"];
  const orders = await listOrders({ status: statuses, tableId });
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  try {
    const { tableId, guestCount = 1, notes } = await req.json();
    if (!tableId) return NextResponse.json({ error: "Mesa requerida" }, { status: 422 });
    const existing = await getActiveOrderForTable(tableId);
    if (existing) return NextResponse.json({ order: existing, alreadyOpen: true });
    const order = await createOrder({
      tableId, guestCount: Number(guestCount), notes,
      openedBy: session.username, openedByName: session.displayName,
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
