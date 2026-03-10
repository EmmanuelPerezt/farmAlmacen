import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { createWarehouse, listWarehousesWithStock } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const warehouses = await listWarehousesWithStock();
  return NextResponse.json({ warehouses });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "No tienes permisos para esta accion." }, { status: 403 });
  }

  const body = await request.json() as { name?: unknown; description?: unknown };

  try {
    const warehouse = await createWarehouse({
      name: String(body.name ?? ""),
      description: typeof body.description === "string" ? body.description : "",
    });
    return NextResponse.json({ warehouse }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No fue posible procesar la solicitud.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
