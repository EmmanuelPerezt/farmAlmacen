import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { createMovement, listMovements } from "@/lib/db";
import type { MovementType } from "@/lib/types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  const movements = await listMovements(limit);
  return NextResponse.json({ movements });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json() as {
    type?: unknown;
    sku?: unknown;
    quantity?: unknown;
    sourceWarehouseId?: unknown;
    targetWarehouseId?: unknown;
    note?: unknown;
  };

  const type = String(body.type ?? "") as MovementType;

  try {
    const movement = await createMovement({
      type,
      sku: Number(body.sku),
      quantity: Number(body.quantity),
      sourceWarehouseId:
        typeof body.sourceWarehouseId === "string" && body.sourceWarehouseId.trim()
          ? body.sourceWarehouseId.trim()
          : undefined,
      targetWarehouseId:
        typeof body.targetWarehouseId === "string" && body.targetWarehouseId.trim()
          ? body.targetWarehouseId.trim()
          : undefined,
      note: typeof body.note === "string" ? body.note : "",
      actor: session,
    });
    return NextResponse.json({ movement }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No fue posible registrar el movimiento.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
