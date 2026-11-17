import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex h-screen w-full flex-row">
      <Sidebar
        firstName={user.first_name ?? "Demo"}
        lastName={user.last_name ?? "User"}
        userEmail={user.email ?? ""}
        userRole={user.role ?? ""}
      />
      <main className="w-full overflow-auto p-6">{children}</main>
    </div>
  );
}
