import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { createProduct, listProductsWithStock } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const products = await listProductsWithStock();
  return NextResponse.json({ products });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "No tienes permisos para esta accion." }, { status: 403 });
  }

  const body = await request.json() as {
    sku?: unknown;
    name?: unknown;
    price?: unknown;
    initialQty?: unknown;
    initialWarehouseId?: unknown;
  };

  try {
    const product = await createProduct({
      sku: Number(body.sku),
      name: String(body.name ?? ""),
      price: Number(body.price),
      initialQty: body.initialQty !== undefined ? Number(body.initialQty) : 0,
      initialWarehouseId:
        typeof body.initialWarehouseId === "string" && body.initialWarehouseId.trim()
          ? body.initialWarehouseId.trim()
          : undefined,
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No fue posible procesar la solicitud.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
