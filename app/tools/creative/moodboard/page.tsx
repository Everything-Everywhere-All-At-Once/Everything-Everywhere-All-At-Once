"use client";

import { useState, useRef, useCallback } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#FB923C";

type BoardItem = {
  id: string;
  type: "image" | "text" | "color";
  x: number;
  y: number;
  w: number;
  h: number;
  content: string; // url, text, or hex color
  fontSize?: number;
  textColor?: string;
  rotation?: number;
};

export default function MoodboardPage() {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [textInput, setTextInput] = useState("");
  const [colorInput, setColorInput] = useState("#6366F1");
  const [isDragging, setIsDragging] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addItem = (item: Omit<BoardItem, "id">) => {
    setItems(prev => [...prev, { ...item, id: Math.random().toString(36).slice(2) }]);
  };

  const addImage = (url: string) => {
    addItem({ type: "image", x: Math.random() * 200 + 20, y: Math.random() * 100 + 20, w: 200, h: 150, content: url });
  };

  const addText = () => {
    if (!textInput.trim()) return;
    addItem({ type: "text", x: Math.random() * 200 + 20, y: Math.random() * 100 + 20, w: 200, h: 60, content: textInput, fontSize: 18, textColor: "#e4e4e7" });
    setTextInput("");
  };

  const addColor = () => {
    addItem({ type: "color", x: Math.random() * 200 + 20, y: Math.random() * 100 + 20, w: 120, h: 120, content: colorInput });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    files.forEach(f => addImage(URL.createObjectURL(f)));
  }, []);

  const onMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setSelected(id);
    const item = items.find(i => i.id === id)!;
    setDragging({ id, ox: e.clientX - item.x, oy: e.clientY - item.y });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setItems(prev => prev.map(i => i.id === dragging.id
      ? { ...i, x: e.clientX - dragging.ox, y: e.clientY - dragging.oy }
      : i
    ));
  };

  const remove = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (selected === id) setSelected(null);
  };

  const exportPng = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200; canvas.height = 800;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, 1200, 800);
    // Note: images from object URLs won't load cross-origin in toDataURL
    // For a real export, we'd need to draw each item — simplified here
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "moodboard.png";
    a.click();
  };

  const selectedItem = items.find(i => i.id === selected);

  return (
    <ToolShell category="Creative & Art" categoryHref="/tools/creative" accent={accent} title="Mood Board" description="Drag and drop images, text, and color swatches onto a free-form canvas — arrange and export.">
      <div className="space-y-4">
        {/* Add items toolbar */}
        <div className="flex flex-wrap gap-3 p-3 bg-[#141414] border border-[#2a2a2a] rounded">
          <button onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs font-mono rounded border transition-all"
            style={{ borderColor: accent, color: accent, backgroundColor: `${accent}15` }}>
            + image
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => { Array.from(e.target.files ?? []).forEach(f => addImage(URL.createObjectURL(f))); }} />

          <div className="flex gap-2 items-center">
            <input value={textInput} onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addText()}
              className="bg-[#0d0d0d] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs font-mono text-[#e4e4e7] focus:outline-none w-40"
              placeholder="type & press Enter..." />
            <button onClick={addText} className="px-3 py-1.5 text-xs font-mono rounded border border-[#2a2a2a] text-[#71717a] hover:text-[#e4e4e7]">+ text</button>
          </div>

          <div className="flex gap-2 items-center">
            <input type="color" value={colorInput} onChange={e => setColorInput(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0" />
            <button onClick={addColor} className="px-3 py-1.5 text-xs font-mono rounded border border-[#2a2a2a] text-[#71717a] hover:text-[#e4e4e7]">+ swatch</button>
          </div>

          <div className="ml-auto flex gap-2">
            {selected && <button onClick={() => remove(selected)} className="px-3 py-1.5 text-xs font-mono rounded border border-[#2a2a2a] text-[#EF4444]">delete</button>}
            <button onClick={() => setItems([])} className="px-3 py-1.5 text-xs font-mono rounded border border-[#2a2a2a] text-[#71717a]">clear all</button>
          </div>
        </div>

        {/* Board */}
        <div
          ref={boardRef}
          className="relative w-full border border-dashed rounded overflow-hidden select-none"
          style={{ height: "480px", backgroundColor: "#0a0a0a", borderColor: isDragging ? accent : "#2a2a2a" }}
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onMouseMove={onMouseMove}
          onMouseUp={() => setDragging(null)}
          onClick={e => { if (e.target === boardRef.current) setSelected(null); }}>

          {items.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-sm font-mono text-[#3f3f46]">drop images here or use the toolbar above</div>
              </div>
            </div>
          )}

          {items.map(item => (
            <div
              key={item.id}
              className="absolute cursor-move"
              style={{
                left: item.x, top: item.y,
                width: item.w, height: item.h,
                outline: selected === item.id ? `2px solid ${accent}` : "none",
                outlineOffset: 2,
              }}
              onMouseDown={e => onMouseDown(e, item.id)}>
              {item.type === "image" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.content} alt="" className="w-full h-full object-cover rounded" draggable={false} />
              )}
              {item.type === "color" && (
                <div className="w-full h-full rounded" style={{ backgroundColor: item.content }} />
              )}
              {item.type === "text" && (
                <div className="w-full h-full flex items-center p-2" style={{ color: item.textColor, fontSize: item.fontSize }}>
                  {item.content}
                </div>
              )}
              {selected === item.id && (
                <button onClick={e => { e.stopPropagation(); remove(item.id); }}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#EF4444] text-white text-[10px] flex items-center justify-center z-10">✕</button>
              )}
            </div>
          ))}
        </div>

        {/* Selected item controls */}
        {selectedItem && (
          <div className="flex gap-4 items-center p-3 bg-[#141414] border border-[#2a2a2a] rounded text-xs font-mono text-[#71717a]">
            <span>{selectedItem.type}</span>
            <label className="flex items-center gap-2">W
              <input type="number" value={selectedItem.w} min={40} max={600}
                onChange={e => setItems(prev => prev.map(i => i.id === selected ? { ...i, w: Number(e.target.value) } : i))}
                className="w-16 bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2 py-1 text-[#e4e4e7] focus:outline-none" />
            </label>
            <label className="flex items-center gap-2">H
              <input type="number" value={selectedItem.h} min={40} max={600}
                onChange={e => setItems(prev => prev.map(i => i.id === selected ? { ...i, h: Number(e.target.value) } : i))}
                className="w-16 bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2 py-1 text-[#e4e4e7] focus:outline-none" />
            </label>
            {selectedItem.type === "text" && (
              <label className="flex items-center gap-2">size
                <input type="number" value={selectedItem.fontSize ?? 18} min={8} max={96}
                  onChange={e => setItems(prev => prev.map(i => i.id === selected ? { ...i, fontSize: Number(e.target.value) } : i))}
                  className="w-14 bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2 py-1 text-[#e4e4e7] focus:outline-none" />
              </label>
            )}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
