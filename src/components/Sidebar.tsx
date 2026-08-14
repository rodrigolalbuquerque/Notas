"use client";

import { FileText, Clock, StickyNote } from "lucide-react";
import type { TagMode } from "@/lib/filter";
import type { View } from "./NotesApp";

export default function Sidebar({
  tags,
  selectedTags,
  mode,
  view,
  onToggleTag,
  onClearTags,
  onModeChange,
  onViewChange,
}: {
  tags: { tag: string; count: number }[];
  selectedTags: string[];
  mode: TagMode;
  view: View;
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  onModeChange: (m: TagMode) => void;
  onViewChange: (v: View) => void;
}) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Marca */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <StickyNote className="h-5 w-5" />
        </span>
        <span className="text-lg font-semibold text-slate-800">Notas</span>
      </div>

      {/* Navegação */}
      <nav className="px-3 py-4">
        <NavItem
          icon={<FileText className="h-4 w-4" />}
          label="Todas as notas"
          active={view === "all"}
          onClick={() => onViewChange("all")}
        />
        <NavItem
          icon={<Clock className="h-4 w-4" />}
          label="Próximos"
          active={view === "upcoming"}
          onClick={() => onViewChange("upcoming")}
        />
      </nav>

      {/* Tags */}
      <div className="flex items-center justify-between px-5 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Tags
        </span>
        <div className="flex items-center gap-0.5 rounded-md bg-slate-100 p-0.5">
          <ModeButton
            active={mode === "and"}
            onClick={() => onModeChange("and")}
            title="Interseção: notas que têm TODAS as tags"
          >
            E
          </ModeButton>
          <ModeButton
            active={mode === "or"}
            onClick={() => onModeChange("or")}
            title="União: notas que têm QUALQUER uma das tags"
          >
            OU
          </ModeButton>
        </div>
      </div>

      {selectedTags.length > 0 && (
        <button
          onClick={onClearTags}
          className="mx-5 mb-1 self-start text-xs text-indigo-600 hover:text-indigo-800"
        >
          Limpar seleção ({selectedTags.length})
        </button>
      )}

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {tags.length === 0 && (
          <p className="px-2 py-2 text-sm text-slate-400">Nenhuma tag ainda.</p>
        )}
        {tags.map(({ tag, count }) => {
          const active = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`relative mb-0.5 flex w-full items-center justify-between rounded-md py-1.5 pl-3 pr-2 text-left text-sm transition ${
                active
                  ? "bg-indigo-50 font-medium text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-indigo-500" />
              )}
              <span className="truncate">#{tag}</span>
              <span
                className={`ml-2 text-xs ${
                  active ? "text-indigo-500" : "text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative mb-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-indigo-500" />
      )}
      {icon}
      {label}
    </button>
  );
}

function ModeButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded px-2 py-0.5 text-xs font-semibold transition ${
        active ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
      }`}
    >
      {children}
    </button>
  );
}
