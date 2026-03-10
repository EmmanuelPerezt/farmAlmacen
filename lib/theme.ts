import { cookies } from "next/headers";

const THEME_COOKIE = "farmalmacen_theme";

export type Theme = "light" | "dark";

export async function getThemeFromCookies(): Promise<Theme> {
  const cookieStore = await cookies();
  const value = cookieStore.get(THEME_COOKIE)?.value;
  return value === "dark" ? "dark" : "light";
}
