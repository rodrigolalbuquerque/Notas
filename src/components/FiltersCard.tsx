"use client";

import { Search, Plus, X } from "lucide-react";
import type { TagMode } from "@/lib/filter";

export default function FiltersCard({
  search,
  selectedTags,
  mode,
  onSearchChange,
  onToggleTag,
  onCreate,
}: {
  search: string;
  selectedTags: string[];
  mode: TagMode;
  onSearchChange: (s: string) => void;
  onToggleTag: (tag: string) => void;
  onCreate: () => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-baseline gap-2 border-b border-slate-100 px-6 py-4">
        <h2 className="font-semibold text-slate-800">Filtros</h2>
        <span className="text-sm text-slate-400">Busque e filtre suas notas</span>
      </div>

      <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por título, conteúdo ou tag…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-indigo-500"
          />
        </div>

        <button
          onClick={onCreate}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Nova nota
        </button>
      </div>

      {/* Chips das tags selecionadas */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-6 py-3">
          <span className="text-xs uppercase tracking-wide text-slate-400">
            {mode === "and" ? "Contém todas:" : "Contém qualquer:"}
          </span>
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
            >
              #{tag}
              <button
                onClick={() => onToggleTag(tag)}
                aria-label={`Remover ${tag}`}
                className="text-indigo-400 hover:text-indigo-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
