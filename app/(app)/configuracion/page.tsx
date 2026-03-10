import { redirect } from "next/navigation";

import { SectionCard } from "@/components/section-card";
import { UserCreateModal } from "@/components/user-create-modal";
import { requireSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { listUsers } from "@/lib/db";

export default async function SettingsPage() {
  const session = await requireSession();

  if (session.role !== "admin") {
    redirect("/dashboard");
  }

  const users = await listUsers();

  return (
    <div className="space-y-6">
      <SectionCard
        title="Crear usuario"
        description="Asistente guiado para crear usuarios y asignar roles"
      >
        <UserCreateModal />
      </SectionCard>

      <SectionCard title="Usuarios activos" description="Roles disponibles: admin y empleado">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
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
                  className="border-b border-[var(--border)] transition hover:bg-[color:rgba(31,99,85,0.05)]"
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
