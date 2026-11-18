"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import { AccountDialog } from "@/components/account-dialog";
import { logout } from "@/lib/auth-actions";
import {
  LayoutDashboard, Users, FolderCog, CalendarRange, FileCheck2,
  UserRoundCheck, ScrollText, ClipboardList, BookOpen, FileText,
  Briefcase, ChevronDown, SunMoon, PanelLeft, Settings, LogOut,
  ShieldAlert, ListTodo, RefreshCcw, Clock, BarChart3, KeyRound, Building2, Mail,
} from "lucide-react";

const adminItems = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/engagement-types", label: "Engagement Types", icon: FolderCog },
  { href: "/admin/periods", label: "Annual Audit Plan Periods", icon: CalendarRange },
  { href: "/admin/declarations", label: "Declarations", icon: FileCheck2 },
  { href: "/admin/delegated-preparers", label: "Delegated Preparers", icon: UserRoundCheck },
  { href: "/admin/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/admin/api-docs", label: "API Documentation", icon: FileText },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/strategic-objectives", label: "Strategic Objectives", icon: FolderCog },
  { href: "/admin/risk-bands", label: "Risk Rating Bands", icon: ShieldAlert },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/admin/sent-emails", label: "Sent Emails", icon: Mail },
];

const mainItems = [
  { href: "/annual-audit-plan", label: "Annual Audit Plan", icon: ClipboardList },
  { href: "/risk-assessment", label: "Risk Assessment", icon: ShieldAlert },
  { href: "/guiding-documents", label: "Guiding Documents", icon: BookOpen },
  { href: "/templates/planning", label: "Document Templates", icon: FileText },
  { href: "/engagements", label: "Engagements", icon: Briefcase },
  { href: "/tasks", label: "Tasks & Scheduling", icon: ListTodo },
  { href: "/follow-up", label: "Follow-up", icon: RefreshCcw },
  { href: "/resources", label: "Resource Allocation", icon: Clock },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

function NavLink({ href, label, icon: Icon, active, indent }: {
  href: string; label: string; icon: React.ElementType; active: boolean; indent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent ${
        indent ? "pl-8" : ""
      } ${active ? "bg-orange-500/15 font-medium text-orange-600" : ""}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

export function Sidebar({
  firstName,
  lastName,
  userEmail,
  userRole,
  orgName,
  orgLogoUrl,
}: {
  firstName: string;
  lastName: string;
  userEmail: string;
  userRole: string;
  orgName: string;
  orgLogoUrl: string;
}) {
  const showAdmin = userRole === "org:admin";
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [adminOpen, setAdminOpen] = useState(pathname.startsWith("/admin"));
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const userName = `${firstName} ${lastName}`.trim() || "Demo User";
  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  if (collapsed) {
    return (
      <aside className="flex w-14 shrink-0 flex-col border-r p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={orgLogoUrl} alt={orgName} className="mb-2 h-8 w-8 rounded-full object-cover" />
        <button onClick={() => setCollapsed(false)} className="rounded-md p-2 hover:bg-accent" title="Expand">
          <PanelLeft className="h-4 w-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r">
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2 px-2 font-semibold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={orgLogoUrl} alt={orgName} className="h-7 w-7 rounded-full object-cover" />
          {orgName}
        </div>
        <button onClick={() => setCollapsed(true)} className="rounded-md p-1.5 hover:bg-accent" title="Collapse">
          <PanelLeft className="h-4 w-4" />
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-auto px-3 text-sm">
        <NavLink href="/dashboard" label="Dashboard" icon={LayoutDashboard} active={isActive("/dashboard")} />
        {showAdmin && (
          <>
            <button
              onClick={() => setAdminOpen((o) => !o)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent"
            >
              <FolderCog className="h-4 w-4 shrink-0" />
              Admin
              <ChevronDown className={`ml-auto h-3.5 w-3.5 transition-transform ${adminOpen ? "" : "-rotate-90"}`} />
            </button>
            {adminOpen && adminItems.map((i) => (
              <NavLink key={i.href} {...i} active={isActive(i.href)} indent />
            ))}
          </>
        )}
        {mainItems.map((i) => (
          <NavLink key={i.href} {...i} active={isActive(i.href)} />
        ))}
      </nav>
      <div className="border-t p-3">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-500"
        >
          <SunMoon className="h-4 w-4" />
          Toggle Theme
        </button>
        <div className="relative mt-3">
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute bottom-full left-0 z-50 mb-2 w-64 overflow-hidden rounded-xl border bg-background shadow-lg">
                <div className="flex items-center gap-3 border-b p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{userName}</div>
                    <div className="truncate text-xs text-muted-foreground">{userEmail}</div>
                  </div>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); setAccountOpen(true); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Manage account
                </button>
                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="flex w-full items-center gap-3 border-t px-4 py-2.5 text-sm hover:bg-accent"
                >
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                  Sign out
                </button>
                <div className="border-t bg-muted/50 px-4 py-2 text-center">
                  <span className="text-xs text-muted-foreground">Demo build</span>
                  <div className="text-xs font-medium text-orange-600">Demo mode</div>
                </div>
              </div>
            </>
          )}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex w-full items-center gap-2 rounded-md px-1 py-1 hover:bg-accent"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white">
              {initials}
            </div>
            <span className="truncate text-sm">{userName}</span>
          </button>
        </div>
      </div>
      {accountOpen && (
        <AccountDialog
          firstName={firstName}
          lastName={lastName}
          email={userEmail}
          onClose={() => setAccountOpen(false)}
        />
      )}
    </aside>
  );
}
