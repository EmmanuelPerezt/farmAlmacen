import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { createUser, listUsers } from "@/lib/db";
import type { Role } from "@/lib/types";

function isRole(value: string): value is Role {
  return value === "admin" || value === "empleado";
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "No tienes permisos para esta accion." }, { status: 403 });
  }

  const users = await listUsers();
  return NextResponse.json({ users });
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
    username?: unknown;
    password?: unknown;
    displayName?: unknown;
    role?: unknown;
  };

  const roleRaw = String(body.role ?? "empleado").trim();
  if (!isRole(roleRaw)) {
    return NextResponse.json({ error: "Rol no valido." }, { status: 422 });
  }

  try {
    const user = await createUser({
      username: String(body.username ?? ""),
      password: String(body.password ?? ""),
      displayName: String(body.displayName ?? ""),
      role: roleRaw,
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No fue posible crear el usuario.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
