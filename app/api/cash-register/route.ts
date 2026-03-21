import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import {
  closeCashRegisterSession,
  createCashRegisterSession,
  findCashRegisterSession,
} from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Se requiere el id de la sesion." }, { status: 400 });
  }

  try {
    const cashRegisterSession = await findCashRegisterSession(id);
    return NextResponse.json({ session: cashRegisterSession });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sesion no encontrada.";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json() as {
    warehouseId?: unknown;
    openingBalance?: unknown;
    action?: unknown;
    sessionId?: unknown;
  };

  const action = String(body.action ?? "open").trim();

  if (action === "close") {
    const sessionId = String(body.sessionId ?? "").trim();
    if (!sessionId) {
      return NextResponse.json({ error: "Se requiere el id de la sesion." }, { status: 400 });
    }
    try {
      const closed = await closeCashRegisterSession(sessionId);
      return NextResponse.json({ session: closed });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible cerrar la sesion.";
      return NextResponse.json({ error: message }, { status: 422 });
    }
  }

  // action === "open"
  const warehouseId = String(body.warehouseId ?? "").trim();
  const openingBalance = Number(body.openingBalance ?? 0);

  try {
    const cashRegisterSession = await createCashRegisterSession({
      warehouseId,
      openingBalance,
      actor: session,
    });
    return NextResponse.json({ session: cashRegisterSession }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No fue posible abrir la caja.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
