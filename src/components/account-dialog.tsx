"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { X, UserRound, ShieldCheck, MoreHorizontal, Plus } from "lucide-react";
import { updateUserProfile } from "@/lib/actions";

const stripeBg = {
  backgroundImage:
    "repeating-linear-gradient(45deg, #faf4ef 0px, #faf4ef 12px, #f7ede5 12px, #f7ede5 24px)",
};

export function AccountDialog({
  firstName,
  lastName,
  email,
  onClose,
}: {
  firstName: string;
  lastName: string;
  email: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"profile" | "security">("profile");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const name = `${firstName} ${lastName}`.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex h-[520px] w-full max-w-3xl overflow-hidden rounded-lg bg-white text-neutral-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left rail */}
        <div className="flex w-56 shrink-0 flex-col p-5" style={stripeBg}>
          <div className="mb-6">
            <div className="text-xl font-bold">Account</div>
            <div className="text-xs text-neutral-500">Manage your account info.</div>
          </div>
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => setTab("profile")}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm ${
                tab === "profile" ? "bg-white/80 font-medium" : "text-neutral-600 hover:bg-white/50"
              }`}
            >
              <UserRound className="h-4 w-4" /> Profile
            </button>
            <button
              onClick={() => setTab("security")}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm ${
                tab === "security" ? "bg-white/80 font-medium" : "text-neutral-600 hover:bg-white/50"
              }`}
            >
              <ShieldCheck className="h-4 w-4" /> Security
            </button>
          </nav>
          <div className="mt-auto flex flex-col items-center gap-1 pb-1 pt-4">
            <div className="text-xs text-neutral-500">
              Secured by <span className="font-semibold text-neutral-700">clerk</span>
            </div>
            <div className="text-xs font-semibold text-orange-600">Development mode</div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-semibold">{tab === "profile" ? "Profile details" : "Security"}</h2>
            <button
              onClick={onClose}
              className="rounded-md border border-neutral-200 p-1.5 text-neutral-500 hover:bg-neutral-50"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {tab === "profile" ? (
            <div>
              <div className="flex items-center gap-4 border-b py-5">
                <span className="w-28 shrink-0 text-sm text-neutral-700">Profile</span>
                <div className="flex flex-1 items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 text-white">
                    <UserRound className="h-6 w-6" />
                  </div>
                  <span className="text-sm">{name}</span>
                </div>
                <button
                  onClick={() => setEditing((e) => !e)}
                  className="text-sm text-neutral-800 hover:underline"
                >
                  Update profile
                </button>
              </div>
              {editing && (
                <form
                  className="flex flex-col gap-3 border-b bg-neutral-50 px-4 py-4"
                  action={async (fd) => {
                    setBusy(true);
                    try {
                      await updateUserProfile(fd);
                      setEditing(false);
                      router.refresh();
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <input name="first_name" defaultValue={firstName} placeholder="First name" required className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm" />
                    <input name="last_name" defaultValue={lastName} placeholder="Last name" required className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm" />
                  </div>
                  <input name="email" type="email" defaultValue={email} placeholder="Email" required className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm" />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm">Cancel</button>
                    <button type="submit" disabled={busy} className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
                      {busy ? "Saving…" : "Save"}
                    </button>
                  </div>
                </form>
              )}
              <div className="flex items-start gap-4 border-b py-5">
                <span className="w-28 shrink-0 pt-0.5 text-sm text-neutral-700">Email addresses</span>
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    {email}
                    <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500">Primary</span>
                  </div>
                  <button onClick={() => setEditing(true)} className="flex w-fit items-center gap-1.5 text-sm text-neutral-800 hover:underline">
                    <Plus className="h-3.5 w-3.5" /> Add email address
                  </button>
                </div>
                <button className="text-neutral-400 hover:text-neutral-600" aria-label="Email options">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-4 border-b py-5">
                <span className="w-28 shrink-0 text-sm text-neutral-700">Password</span>
                <span className="flex-1 text-sm">••••••••</span>
                <span className="text-xs text-neutral-400">Managed by auth provider in production</span>
              </div>
              <div className="flex items-center gap-4 border-b py-5">
                <span className="w-28 shrink-0 text-sm text-neutral-700">Sessions</span>
                <span className="flex-1 text-sm">Demo session</span>
                <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">Active</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
