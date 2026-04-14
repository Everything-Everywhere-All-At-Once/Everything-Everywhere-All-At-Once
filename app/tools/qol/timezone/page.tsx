"use client";

import { useState, useEffect } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#6366F1";

const ZONES = [
  { label: "UTC", tz: "UTC" },
  { label: "New York", tz: "America/New_York" },
  { label: "Chicago", tz: "America/Chicago" },
  { label: "Denver", tz: "America/Denver" },
  { label: "Los Angeles", tz: "America/Los_Angeles" },
  { label: "São Paulo", tz: "America/Sao_Paulo" },
  { label: "London", tz: "Europe/London" },
  { label: "Paris", tz: "Europe/Paris" },
  { label: "Berlin", tz: "Europe/Berlin" },
  { label: "Moscow", tz: "Europe/Moscow" },
  { label: "Dubai", tz: "Asia/Dubai" },
  { label: "Mumbai", tz: "Asia/Kolkata" },
  { label: "Bangkok", tz: "Asia/Bangkok" },
  { label: "Singapore", tz: "Asia/Singapore" },
  { label: "Shanghai", tz: "Asia/Shanghai" },
  { label: "Tokyo", tz: "Asia/Tokyo" },
  { label: "Seoul", tz: "Asia/Seoul" },
  { label: "Sydney", tz: "Australia/Sydney" },
  { label: "Auckland", tz: "Pacific/Auckland" },
  { label: "Honolulu", tz: "Pacific/Honolulu" },
];

function formatInTz(date: Date, tz: string): { time: string; date: string; offset: string } {
  const time = date.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const d = date.toLocaleDateString("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" });
  const offsetMs = new Date(date.toLocaleString("en-US", { timeZone: tz })).getTime() - new Date(date.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  const offsetH = Math.round(offsetMs / 3600000);
  const offset = `UTC${offsetH >= 0 ? "+" : ""}${offsetH}`;
  return { time, date: d, offset };
}

export default function TimezonePage() {
  const [now, setNow] = useState(new Date());
  const [pinned, setPinned] = useState<string[]>(["UTC", "America/New_York", "Europe/London", "Asia/Tokyo"]);
  const [search, setSearch] = useState("");
  const [inputDate, setInputDate] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  useEffect(() => {
    if (useCustom) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [useCustom]);

  const displayDate = useCustom && inputDate ? new Date(inputDate) : now;
  const filtered = ZONES.filter(z => !search || z.label.toLowerCase().includes(search.toLowerCase()) || z.tz.toLowerCase().includes(search.toLowerCase()));

  const togglePin = (tz: string) => setPinned(p => p.includes(tz) ? p.filter(x => x !== tz) : [...p, tz]);

  const ZoneRow = ({ tz, label }: { tz: string; label: string }) => {
    const { time, date, offset } = formatInTz(displayDate, tz);
    const isPinned = pinned.includes(tz);
    return (
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[#1a1a1a] last:border-0">
        <button onClick={() => togglePin(tz)} className="text-[10px] shrink-0" style={{ color: isPinned ? accent : "#3f3f46" }}>
          {isPinned ? "★" : "☆"}
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-mono text-[#e4e4e7]">{label}</div>
          <div className="text-[10px] text-[#3f3f46] font-mono">{offset} · {date}</div>
        </div>
        <div className="text-sm font-mono shrink-0" style={{ color: accent }}>{time}</div>
      </div>
    );
  };

  const pinnedZones = ZONES.filter(z => pinned.includes(z.tz));
  const unpinnedFiltered = filtered.filter(z => !pinned.includes(z.tz));

  return (
    <ToolShell category="Quality of Life" categoryHref="/tools/qol" accent={accent} title="Time Zone Converter" description="See the current time across every major time zone — star zones to pin them to the top.">
      <div className="space-y-5">
        {/* Custom time input */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-[10px] tracking-widest text-[#71717a] uppercase font-mono mb-2">
              {useCustom ? "custom date & time" : "current time (live)"}
            </label>
            <input type="datetime-local" value={inputDate} onChange={e => { setInputDate(e.target.value); setUseCustom(true); }}
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-4 py-2.5 text-sm font-mono text-[#e4e4e7] focus:outline-none" />
          </div>
          {useCustom && (
            <button onClick={() => { setUseCustom(false); setInputDate(""); setNow(new Date()); }}
              className="px-4 py-2.5 text-xs font-mono rounded border border-[#2a2a2a] text-[#71717a] hover:text-[#e4e4e7]">
              live
            </button>
          )}
        </div>

        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-4 py-2.5 text-sm font-mono text-[#e4e4e7] focus:outline-none"
          placeholder="search time zones..." />

        <div className="border border-[#2a2a2a] rounded overflow-hidden">
          {pinnedZones.length > 0 && (
            <>
              <div className="px-4 py-2 bg-[#141414] border-b border-[#2a2a2a]">
                <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">pinned</span>
              </div>
              {pinnedZones.map(z => <ZoneRow key={z.tz} {...z} />)}
            </>
          )}
          {unpinnedFiltered.length > 0 && (
            <>
              <div className="px-4 py-2 bg-[#141414] border-b border-[#2a2a2a] border-t border-[#2a2a2a]">
                <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">all zones</span>
              </div>
              {unpinnedFiltered.map(z => <ZoneRow key={z.tz} {...z} />)}
            </>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
