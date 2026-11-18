"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CodeBlock({ title, code }: { title?: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-md border bg-zinc-950 text-zinc-100">
      {title && (
        <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-1.5 text-xs text-zinc-400">
          <span>{title}</span>
          <button
            aria-label="Copy code"
            onClick={async () => {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="text-zinc-400 hover:text-zinc-100"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">{code}</pre>
    </div>
  );
}
