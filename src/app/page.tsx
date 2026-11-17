import Image from "next/image";
import { LoginForm } from "@/components/login-form";

// DEMO: anyone can log in — replaces the original Clerk <SignIn> gate
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4">
      <Image
        src="/polaris.png"
        alt="Polaris"
        width={200}
        height={103}
        priority
        className="mb-8"
      />
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-bold text-neutral-900">Sign in to Polaris</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Welcome back! Please sign in to continue
          </p>
        </div>
        <LoginForm />
      </div>
      <p className="mt-6 text-xs text-neutral-400">A Stella Lumen Product · Demo build</p>
    </div>
  );
}
