"use client";
import { ToolShell } from "@/components/tool-shell";
const accent = "#FACC15";
export default function Page() {
  return (
    <ToolShell category="AI Tools" categoryHref="/tools/ai" accent={accent} title="AI Tool" description="Coming soon — AI-powered tools require API integration.">
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="text-4xl opacity-10">◎</div>
        <div className="text-sm font-mono text-[#71717a]">coming soon</div>
        <div className="text-xs font-mono text-[#3f3f46]">AI tools require API key integration — launching soon.</div>
      </div>
    </ToolShell>
  );
}
