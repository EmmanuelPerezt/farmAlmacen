import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { updateOrderItem, removeOrderItem } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { itemId } = await params;
  const body = await req.json();
  const order = await updateOrderItem(itemId, body);
  return NextResponse.json({ order });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { itemId } = await params;
  const order = await removeOrderItem(itemId);
  return NextResponse.json({ order });
}
