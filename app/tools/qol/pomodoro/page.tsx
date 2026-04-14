"use client";

import { useState, useEffect, useRef } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#6366F1";

type Phase = "work" | "short" | "long";

const DEFAULTS: Record<Phase, number> = { work: 25, short: 5, long: 15 };

const PHASE_LABELS: Record<Phase, string> = { work: "focus", short: "short break", long: "long break" };
const PHASE_COLORS: Record<Phase, string> = { work: "#6366F1", short: "#22C55E", long: "#00E5FF" };

export default function PomodoroPage() {
  const [phase, setPhase] = useState<Phase>("work");
  const [durations, setDurations] = useState(DEFAULTS);
  const [seconds, setSeconds] = useState(DEFAULTS.work * 60);
  const [running, setRunning] = useState(false);
  const [session, setSession] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [sessionsUntilLong, setSessionsUntilLong] = useState(4);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const color = PHASE_COLORS[phase];
  const total = durations[phase] * 60;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            // Notify
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              new Notification("EEAAO Pomodoro", { body: phase === "work" ? "Time for a break!" : "Back to work!" });
            }
            // Auto-advance
            if (phase === "work") {
              const newCompleted = completed + 1;
              setCompleted(newCompleted);
              setSession(ses => ses + 1);
              const nextPhase: Phase = newCompleted % sessionsUntilLong === 0 ? "long" : "short";
              setPhase(nextPhase);
              return durations[nextPhase] * 60;
            } else {
              setPhase("work");
              return durations.work * 60;
            }
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, phase, durations, completed, sessionsUntilLong]);

  const switchPhase = (p: Phase) => {
    setRunning(false);
    setPhase(p);
    setSeconds(durations[p] * 60);
  };

  const reset = () => { setRunning(false); setSeconds(durations[phase] * 60); };
  const resetAll = () => { setRunning(false); setPhase("work"); setSeconds(durations.work * 60); setCompleted(0); setSession(0); };

  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  const progress = 1 - seconds / total;

  const requestNotif = () => {
    if (typeof Notification !== "undefined") Notification.requestPermission();
  };

  return (
    <ToolShell category="Quality of Life" categoryHref="/tools/qol" accent={accent} title="Pomodoro Timer" description="Focus timer with work sessions and breaks — customizable durations, session tracking.">
      <div className="space-y-6">
        {/* Phase selector */}
        <div className="flex gap-2">
          {(["work", "short", "long"] as const).map(p => (
            <button key={p} onClick={() => switchPhase(p)}
              className="flex-1 py-2 text-xs font-mono rounded border transition-all capitalize"
              style={phase === p ? { borderColor: PHASE_COLORS[p], color: PHASE_COLORS[p], backgroundColor: `${PHASE_COLORS[p]}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
              {PHASE_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Timer display */}
        <div className="flex flex-col items-center gap-6 py-6">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#1a1a1a" strokeWidth="4" />
              <circle cx="50" cy="50" r="44" fill="none" stroke={color} strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s linear" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-mono font-bold" style={{ color }}>{mins}:{secs}</div>
              <div className="text-[10px] font-mono text-[#71717a] mt-1 uppercase tracking-widest">{PHASE_LABELS[phase]}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button onClick={() => setRunning(r => !r)}
              className="px-8 py-3 text-sm font-mono tracking-widest rounded border transition-all"
              style={{ borderColor: color, color: running ? "#0d0d0d" : color, backgroundColor: running ? color : `${color}20` }}>
              {running ? "pause" : "start"}
            </button>
            <button onClick={reset} className="px-4 py-3 text-xs font-mono rounded border border-[#2a2a2a] text-[#71717a] hover:text-[#e4e4e7]">reset</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "sessions", value: session },
            { label: "completed", value: completed },
            { label: "until long", value: sessionsUntilLong - (completed % sessionsUntilLong) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#141414] border border-[#2a2a2a] rounded p-3 text-center">
              <div className="text-xl font-mono font-bold" style={{ color }}>{value}</div>
              <div className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Settings */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded p-4 space-y-4">
          <div className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">settings</div>
          <div className="grid grid-cols-2 gap-4">
            {(["work", "short", "long"] as const).map(p => (
              <div key={p}>
                <label className="block text-[10px] font-mono text-[#71717a] mb-1 capitalize">{PHASE_LABELS[p]} (min)</label>
                <input type="number" min={1} max={120} value={durations[p]}
                  onChange={e => {
                    const v = Math.max(1, Number(e.target.value));
                    setDurations(d => ({ ...d, [p]: v }));
                    if (p === phase && !running) setSeconds(v * 60);
                  }}
                  className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-3 py-2 text-sm font-mono text-[#e4e4e7] focus:outline-none" />
              </div>
            ))}
            <div>
              <label className="block text-[10px] font-mono text-[#71717a] mb-1">sessions until long break</label>
              <input type="number" min={1} max={10} value={sessionsUntilLong}
                onChange={e => setSessionsUntilLong(Math.max(1, Number(e.target.value)))}
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-3 py-2 text-sm font-mono text-[#e4e4e7] focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={requestNotif} className="text-[10px] font-mono text-[#71717a] hover:text-[#e4e4e7]">enable notifications</button>
          <button onClick={resetAll} className="text-[10px] font-mono text-[#EF4444] hover:text-[#EF4444]/80">reset all</button>
        </div>
      </div>
    </ToolShell>
  );
}
