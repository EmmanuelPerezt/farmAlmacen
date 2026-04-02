import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getOrder, updateOrder, billOrder, payOrder, cancelOrder } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  try {
    const body = await req.json();
    const { action, ...data } = body;

    let order;
    if (action === "bill") {
      order = await billOrder(id);
    } else if (action === "pay") {
      order = await payOrder(id, { cashReceived: data.cashReceived, paymentMethod: data.paymentMethod ?? "cash" });
    } else if (action === "cancel") {
      order = await cancelOrder(id);
    } else {
      order = await updateOrder(id, data);
    }
    return NextResponse.json({ order });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
