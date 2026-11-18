"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    SwaggerUIBundle?: (opts: Record<string, unknown>) => void;
  }
}

export default function SwaggerDocsPage() {
  useEffect(() => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css";
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js";
    script.onload = () => {
      window.SwaggerUIBundle?.({
        url: "/api/v1/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        docExpansion: "list",
      });
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b px-6 py-3 text-sm text-muted-foreground">
        Polaris REST API — interactive docs. Paste your <code>x-api-key</code> via
        the <b>Authorize</b> button to try endpoints live.{" "}
        <a href="/admin/api-docs" className="text-orange-600 hover:underline">
          Back to in-app documentation
        </a>
      </div>
      <div id="swagger-ui" />
    </div>
  );
}
