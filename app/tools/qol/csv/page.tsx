"use client";

import { useState, useRef } from "react";
import { ToolShell } from "@/components/tool-shell";

const accent = "#6366F1";

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let col = "", row: string[] = [], inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') { col += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if ((c === ',' || c === '\t') && !inQuotes) {
      row.push(col); col = "";
    } else if ((c === '\n' || (c === '\r' && text[i + 1] === '\n')) && !inQuotes) {
      if (c === '\r') i++;
      row.push(col); col = "";
      if (row.some(c => c !== "")) rows.push(row);
      row = [];
    } else {
      col += c;
    }
  }
  if (col || row.length) { row.push(col); if (row.some(c => c !== "")) rows.push(row); }
  return rows;
}

export default function CsvPage() {
  const [rows, setRows]   = useState<string[][]>([]);
  const [file, setFile]   = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => setRows(parseCSV(e.target?.result as string ?? ""));
    reader.readAsText(f);
  };

  const headers = rows[0] ?? [];
  const data    = rows.slice(1);

  const filtered = data.filter(row =>
    search === "" || row.some(cell => cell.toLowerCase().includes(search.toLowerCase()))
  );

  const sorted = sortCol === null ? filtered : [...filtered].sort((a, b) => {
    const av = a[sortCol] ?? "", bv = b[sortCol] ?? "";
    const an = parseFloat(av), bn = parseFloat(bv);
    const cmp = !isNaN(an) && !isNaN(bn) ? an - bn : av.localeCompare(bv);
    return sortAsc ? cmp : -cmp;
  });

  const toggleSort = (i: number) => {
    if (sortCol === i) setSortAsc(a => !a);
    else { setSortCol(i); setSortAsc(true); }
  };

  return (
    <ToolShell category="Quality of Life" categoryHref="/tools/qol" accent={accent} title="CSV Viewer" description="Drop any CSV or TSV file — browse as a searchable, sortable table. Nothing uploaded.">
      <div className="space-y-4">
        {/* Drop zone */}
        <div onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) load(f); }}
          className="border border-dashed rounded-lg p-6 text-center cursor-pointer transition-all"
          style={{ borderColor: file ? `${accent}60` : "#2a2a2a" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${accent}60`}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = file ? `${accent}60` : "#2a2a2a"}>
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) load(f); }} />
          {file
            ? <div className="font-mono text-sm text-[#e4e4e7]">{file.name} <span className="text-[#71717a]">· {rows.length} rows · {headers.length} cols</span></div>
            : <div className="text-sm text-[#71717a] font-mono">drop CSV / TSV or click to browse</div>
          }
        </div>

        {rows.length > 0 && (
          <>
            {/* Controls */}
            <div className="flex gap-3">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="filter rows..."
                className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs font-mono text-[#e4e4e7] placeholder:text-[#3f3f46] focus:outline-none focus:border-[#3f3f46] transition-colors" />
              <span className="text-[10px] font-mono text-[#52525b] self-center shrink-0">{sorted.length} / {data.length} rows</span>
            </div>

            {/* Table */}
            <div className="overflow-auto rounded border border-[#2a2a2a] max-h-[60vh]">
              <table className="w-full text-xs font-mono border-collapse min-w-max">
                <thead className="sticky top-0 z-10 bg-[#141414]">
                  <tr>
                    <th className="px-2 py-2 text-right text-[9px] text-[#3f3f46] border-b border-r border-[#2a2a2a] w-8">#</th>
                    {headers.map((h, i) => (
                      <th key={i} onClick={() => toggleSort(i)}
                        className="px-3 py-2 text-left border-b border-r border-[#2a2a2a] cursor-pointer select-none whitespace-nowrap"
                        style={{ color: sortCol === i ? accent : "#71717a" }}>
                        {h || `col ${i + 1}`}
                        {sortCol === i && <span className="ml-1">{sortAsc ? "↑" : "↓"}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.slice(0, 500).map((row, ri) => (
                    <tr key={ri} className="border-b border-[#1a1a1a] hover:bg-[#141414] transition-colors">
                      <td className="px-2 py-1.5 text-right text-[9px] text-[#2a2a2a] border-r border-[#1a1a1a]">{ri + 1}</td>
                      {headers.map((_, ci) => (
                        <td key={ci} className="px-3 py-1.5 text-[#a1a1aa] border-r border-[#1a1a1a] max-w-[200px] truncate">
                          {row[ci] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {sorted.length > 500 && (
                <div className="text-center text-[10px] font-mono text-[#3f3f46] py-3">showing 500 of {sorted.length} rows</div>
              )}
            </div>
          </>
        )}
      </div>
    </ToolShell>
  );
}
