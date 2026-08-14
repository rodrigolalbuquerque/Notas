"use client";

import { Plus } from "lucide-react";
import type { LocalNote } from "@/lib/types";

export default function NoteList({
  notes,
  selectedId,
  onSelect,
  onCreate,
}: {
  notes: LocalNote[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-baseline gap-2">
          <h2 className="font-semibold text-slate-800">Notas</h2>
          <span className="text-sm text-slate-400">
            {notes.length} {notes.length === 1 ? "resultado" : "resultados"}
          </span>
        </div>
        <button
          onClick={onCreate}
          title="Nova nota"
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {notes.length === 0 && (
          <p className="px-2 py-10 text-center text-sm text-slate-400">
            Nenhuma nota!
          </p>
        )}
        {notes.map((note) => (
          <button
            key={note.id}
            onClick={() => onSelect(note.id)}
            className={`mb-1 block w-full rounded-lg border px-3 py-2.5 text-left transition ${
              selectedId === note.id
                ? "border-indigo-200 bg-indigo-50"
                : "border-transparent hover:bg-slate-50"
            }`}
          >
            <div className="truncate text-sm font-medium text-slate-800">
              {note.title || "(sem título)"}
            </div>
            <div className="mt-0.5 truncate text-xs text-slate-500">
              {note.content.replace(/[#*`>_-]/g, "").trim() || "Vazia"}
            </div>
            {note.tags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {note.tags.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
            {note.remind_at && (
              <div className="mt-1 text-[11px] text-amber-600">
                ⏰ {new Date(note.remind_at).toLocaleString("pt-BR")}
              </div>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
