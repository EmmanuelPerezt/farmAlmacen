import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { updateMenuCategory, deleteMenuCategory } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const category = await updateMenuCategory(id, body);
  return NextResponse.json({ category });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const { id } = await params;
  await deleteMenuCategory(id);
  return NextResponse.json({ ok: true });
}
