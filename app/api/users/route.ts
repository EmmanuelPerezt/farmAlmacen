import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { createUser } from "@/lib/store";
import type { Role } from "@/lib/types";

function redirectToSettings(
  request: NextRequest,
  params: { success?: string; error?: string; context?: "create" },
): NextResponse {
  const url = new URL("/configuracion", request.url);

  if (params.success) {
    url.searchParams.set("success", params.success);
  }

  if (params.error) {
    url.searchParams.set("error", params.error);
  }

  if (params.context) {
    url.searchParams.set("context", params.context);
  }

  return NextResponse.redirect(url);
}

function isRole(value: string): value is Role {
  return value === "admin" || value === "empleado";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = getSessionFromRequest(request);

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const formData = await request.formData();
  const roleRaw = String(formData.get("role") ?? "empleado").trim();

  if (!isRole(roleRaw)) {
    return redirectToSettings(request, { error: "Rol no valido.", context: "create" });
  }

  try {
    createUser({
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
      displayName: String(formData.get("displayName") ?? ""),
      role: roleRaw,
    });

    return redirectToSettings(request, {
      success: "Usuario creado correctamente.",
      context: "create",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible crear el usuario.";
    return redirectToSettings(request, { error: message, context: "create" });
  }
}
