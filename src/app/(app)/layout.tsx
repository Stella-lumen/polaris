import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const org = await prisma.organization.findUnique({
    where: { id: user.organization_id ?? DEMO_ORGANIZATION_ID },
    select: { name: true, logo_file_id: true },
  });
  return (
    <div className="flex h-screen w-full flex-row">
      <Sidebar
        firstName={user.first_name ?? "Demo"}
        lastName={user.last_name ?? "User"}
        userEmail={user.email ?? ""}
        userRole={user.role ?? ""}
        orgName={org?.name ?? "Stella Lumen"}
        orgLogoUrl={org?.logo_file_id ? `/api/files/${org.logo_file_id}` : "/stella-lumen.jpg"}
      />
      <main className="w-full overflow-auto p-6">{children}</main>
    </div>
  );
}
