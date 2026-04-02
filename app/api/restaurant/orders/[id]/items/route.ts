import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { addOrderItem, markItemsSent } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  try {
    const body = await req.json();
    if (body.action === "send") {
      const order = await markItemsSent(id);
      return NextResponse.json({ order });
    }
    const { menuItemId, quantity = 1, notes } = body;
    if (!menuItemId) return NextResponse.json({ error: "Item requerido" }, { status: 422 });
    const order = await addOrderItem(id, { menuItemId, quantity: Number(quantity), notes });
    return NextResponse.json({ order }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
