import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { createSale, listSales } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  const sales = await listSales(limit);
  return NextResponse.json({ sales });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json() as {
    warehouseId?: unknown;
    items?: unknown;
    cashReceived?: unknown;
  };

  const warehouseId = String(body.warehouseId ?? "").trim();
  const cashReceived = Number(body.cashReceived ?? 0);
  const items = Array.isArray(body.items)
    ? (body.items as Array<{ sku: number; quantity: number }>)
    : [];

  try {
    const sale = await createSale({ warehouseId, items, cashReceived, actor: session });
    return NextResponse.json({ sale }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No fue posible registrar la venta.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
