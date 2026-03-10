import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { findSaleById } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const sale = await findSaleById(id);
    return NextResponse.json({ sale });
  } catch (error) {
    const message = error instanceof Error ? error.message : "La venta no existe.";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
