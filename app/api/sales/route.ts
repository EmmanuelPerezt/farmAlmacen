import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { createSale, listAdminUsers, listSales } from "@/lib/db";
import type { SaleType } from "@/lib/types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;
  const admins = searchParams.get("admins");

  if (admins === "1") {
    const adminUsers = await listAdminUsers();
    return NextResponse.json({ admins: adminUsers });
  }

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
    saleType?: unknown;
    authorizedBy?: unknown;
    authorizedByName?: unknown;
    cashRegisterSessionId?: unknown;
  };

  const warehouseId = String(body.warehouseId ?? "").trim();
  const cashReceived = Number(body.cashReceived ?? 0);
  const saleType = (body.saleType === "cortesia" ? "cortesia" : "normal") as SaleType;
  const authorizedBy = body.authorizedBy ? String(body.authorizedBy) : undefined;
  const authorizedByName = body.authorizedByName ? String(body.authorizedByName) : undefined;
  const cashRegisterSessionId = body.cashRegisterSessionId
    ? String(body.cashRegisterSessionId)
    : undefined;
  const items = Array.isArray(body.items)
    ? (body.items as Array<{ sku: number; quantity: number }>)
    : [];

  try {
    const sale = await createSale({
      warehouseId,
      items,
      cashReceived,
      saleType,
      authorizedBy,
      authorizedByName,
      cashRegisterSessionId,
      actor: session,
    });
    return NextResponse.json({ sale }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No fue posible registrar la venta.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
