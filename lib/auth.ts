import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest, NextResponse } from "next/server";

import type { Session } from "@/lib/types";

const SESSION_COOKIE_NAME = "farmalmacen_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function isValidRole(value: string): value is Session["role"] {
  return value === "admin" || value === "empleado";
}

function encodeSession(session: Session): string {
  const payload = JSON.stringify(session);
  return Buffer.from(payload, "utf8").toString("base64url");
}

function decodeSession(value: string): Session | null {
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as Partial<Session>;

    if (
      typeof parsed.username !== "string" ||
      typeof parsed.displayName !== "string" ||
      typeof parsed.role !== "string" ||
      !isValidRole(parsed.role)
    ) {
      return null;
    }

    return {
      username: parsed.username,
      displayName: parsed.displayName,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  return decodeSession(sessionCookie);
}

export function getSessionFromRequest(request: NextRequest): Session | null {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  return decodeSession(sessionCookie);
}

export function setSessionCookie(response: NextResponse, session: Session): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: encodeSession(session),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function requireSession(): Promise<Session> {
  const session = await getSessionFromCookies();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireAdminSession(): Promise<Session> {
  const session = await requireSession();

  if (session.role !== "admin") {
    redirect("/dashboard");
  }

  return session;
}
