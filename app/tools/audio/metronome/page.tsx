"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#00FFFF";

const TIME_SIGS = [
  { label: "4/4", beats: 4 },
  { label: "3/4", beats: 3 },
  { label: "6/8", beats: 6 },
  { label: "2/4", beats: 2 },
  { label: "5/4", beats: 5 },
  { label: "7/8", beats: 7 },
];

export default function MetronomePage() {
  const [bpm, setBpm]       = useState(120);
  const [running, setRunning] = useState(false);
  const [beat, setBeat]     = useState(0);
  const [sig, setSig]       = useState(TIME_SIGS[0]);
  const [accent_, setAccent_] = useState(true); // accent first beat
  const acRef   = useRef<AudioContext | null>(null);
  const rafRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextRef = useRef(0);
  const beatRef = useRef(0);
  const bpmRef  = useRef(bpm);
  const sigRef  = useRef(sig);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { sigRef.current = sig; }, [sig]);

  const click = useCallback((ac: AudioContext, time: number, isAccent: boolean) => {
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.frequency.value = isAccent ? 1000 : 800;
    gain.gain.setValueAtTime(isAccent ? 0.6 : 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    osc.start(time);
    osc.stop(time + 0.05);
  }, []);

  const schedule = useCallback(() => {
    const ac = acRef.current!;
    while (nextRef.current < ac.currentTime + 0.1) {
      const isFirst = beatRef.current % sigRef.current.beats === 0;
      click(ac, nextRef.current, accent_ && isFirst);
      setBeat(beatRef.current % sigRef.current.beats);
      beatRef.current++;
      nextRef.current += 60 / bpmRef.current;
    }
    rafRef.current = setTimeout(schedule, 25);
  }, [click, accent_]);

  const start = useCallback(async () => {
    if (!acRef.current) acRef.current = new AudioContext();
    if (acRef.current.state === "suspended") await acRef.current.resume();
    beatRef.current = 0;
    nextRef.current = acRef.current.currentTime + 0.05;
    setRunning(true);
    schedule();
  }, [schedule]);

  const stop = useCallback(() => {
    if (rafRef.current) clearTimeout(rafRef.current);
    setRunning(false);
    setBeat(0);
  }, []);

  const toggle = () => running ? stop() : start();

  const tempo = bpm < 60 ? "Largo" : bpm < 66 ? "Larghetto" : bpm < 76 ? "Adagio" : bpm < 108 ? "Andante" : bpm < 120 ? "Moderato" : bpm < 156 ? "Allegro" : bpm < 176 ? "Vivace" : bpm < 200 ? "Presto" : "Prestissimo";

  return (
    <ToolShell category="Audio & Music" categoryHref="/tools/audio" accent={accent} title="Metronome" description="Precise Web Audio metronome — adjustable BPM, time signatures, and accented downbeat.">
      <div className="space-y-6">
        {/* Beat indicators */}
        <div className="flex justify-center gap-3 py-2">
          {Array.from({ length: sig.beats }).map((_, i) => (
            <div key={i} className="w-10 h-10 rounded-full border-2 transition-all duration-75 flex items-center justify-center text-xs font-mono"
              style={{
                borderColor: running && beat === i ? (i === 0 ? "#FF3399" : accent) : "#2a2a2a",
                backgroundColor: running && beat === i ? (i === 0 ? "rgba(255,51,153,0.2)" : `${accent}20`) : "transparent",
                color: running && beat === i ? (i === 0 ? "#FF3399" : accent) : "#3f3f46",
              }}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* BPM display */}
        <div className="text-center">
          <div className="text-7xl font-black font-mono" style={{ color: accent }}>{bpm}</div>
          <div className="text-xs font-mono text-[#52525b] mt-1">{tempo}</div>
        </div>

        {/* BPM slider */}
        <div>
          <input type="range" min={20} max={300} value={bpm}
            onChange={e => setBpm(+e.target.value)}
            className="w-full cursor-pointer" style={{ accentColor: accent }} />
          <div className="flex justify-between text-[9px] font-mono text-[#3f3f46] mt-1">
            <span>20</span><span>300</span>
          </div>
        </div>

        {/* BPM buttons */}
        <div className="flex justify-center gap-2">
          {[-10, -5, -1, +1, +5, +10].map(d => (
            <button key={d} onClick={() => setBpm(b => Math.max(20, Math.min(300, b + d)))}
              className="px-2.5 py-1 text-xs font-mono rounded border border-[#2a2a2a] text-[#71717a] hover:text-[#e4e4e7] hover:border-[#3f3f46] transition-all">
              {d > 0 ? `+${d}` : d}
            </button>
          ))}
        </div>

        {/* Play/Stop */}
        <button onClick={toggle}
          className="w-full py-4 text-sm font-mono tracking-widest rounded border-2 transition-all"
          style={running
            ? { borderColor: "#EF4444", color: "#EF4444", backgroundColor: "rgba(239,68,68,0.1)" }
            : { borderColor: accent, color: "#0d0d0d", backgroundColor: accent }}>
          {running ? "stop" : "start"}
        </button>

        {/* Time signature */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#52525b] mb-2">time signature</div>
          <div className="flex gap-2 flex-wrap">
            {TIME_SIGS.map(s => (
              <button key={s.label} onClick={() => { setSig(s); if (running) { stop(); } }}
                className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
                style={sig.label === s.label ? { borderColor: accent, color: accent, backgroundColor: `${accent}15` } : { borderColor: "#2a2a2a", color: "#71717a" }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accent toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setAccent_(v => !v)}
            className="w-8 h-4 rounded-full relative transition-colors"
            style={{ backgroundColor: accent_ ? accent : "#2a2a2a" }}>
            <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
              style={{ left: accent_ ? "calc(100% - 14px)" : "2px" }} />
          </div>
          <span className="text-xs font-mono text-[#71717a]">accent downbeat</span>
        </label>
      </div>
    </ToolShell>
  );
}
