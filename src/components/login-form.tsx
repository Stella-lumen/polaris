"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { login } from "@/lib/auth-actions";

export function LoginForm() {
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-4"
      action={async (fd) => {
        setBusy(true);
        setError(null);
        const res = await login(fd);
        if (res?.error) {
          setError(res.error);
          setBusy(false);
        }
      }}
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-600">Email address</label>
        <input
          type="email"
          name="email"
          required
          defaultValue="sinethemba@stella-lumen.com"
          className="w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-xs font-medium text-neutral-600">Password</label>
          <button type="button" className="text-xs text-neutral-500 hover:underline">
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            name="password"
            required
            className="w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 pr-9 text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            aria-label="Toggle password visibility"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Continue →"}
      </button>
      <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700">
        <div className="font-medium">Demo build — seeded credentials:</div>
        <div className="mt-1 font-mono">sinethemba@stella-lumen.com / Polaris2026!</div>
        <div className="text-[10px] text-orange-500">roles: admin (Sinethemba) · CAE (lusanda@example.com) · member (amahle@example.com)</div>
      </div>
    </form>
  );
}
