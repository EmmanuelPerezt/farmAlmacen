import { redirect } from "next/navigation";

import { NoticeBanner } from "@/components/notice-banner";
import { SectionCard } from "@/components/section-card";
import { UserCreateModal } from "@/components/user-create-modal";
import { requireSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { readSearchParam } from "@/lib/query";
import { listUsers } from "@/lib/store";

type SettingsPageProps = {
  searchParams?: Promise<{
    success?: string | string[];
    error?: string | string[];
    context?: string | string[];
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const session = await requireSession();

  if (session.role !== "admin") {
    redirect("/dashboard");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const success = readSearchParam(resolvedSearchParams?.success);
  const error = readSearchParam(resolvedSearchParams?.error);
  const context = readSearchParam(resolvedSearchParams?.context);
  const createError = context === "create" ? error : undefined;
  const pageError = context === "create" ? undefined : error;

  const users = listUsers();

  return (
    <div className="space-y-6">
      <NoticeBanner success={success} error={pageError} />

      <SectionCard
        title="Crear usuario"
        description="Asistente guiado para crear usuarios y asignar roles"
      >
        <UserCreateModal formError={createError} />
      </SectionCard>

      <SectionCard title="Usuarios activos" description="Roles disponibles: admin y empleado">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[color:rgba(148,163,184,0.34)] text-left text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                <th className="pb-2 pr-3">Usuario</th>
                <th className="pb-2 pr-3">Nombre</th>
                <th className="pb-2 pr-3">Rol</th>
                <th className="pb-2">Creado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[color:rgba(148,163,184,0.28)] transition hover:bg-[color:rgba(31,99,85,0.05)]"
                >
                  <td className="py-2 pr-3 text-[var(--foreground)]">@{user.username}</td>
                  <td className="py-2 pr-3 font-semibold text-[var(--foreground)]">{user.displayName}</td>
                  <td className="py-2 pr-3 text-[var(--foreground)]">{user.role}</td>
                  <td className="py-2 text-[var(--ink-soft)]">{formatDateTime(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
