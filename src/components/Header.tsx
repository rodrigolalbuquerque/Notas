"use client";

import { useState } from "react";
import { ChevronRight, LogOut } from "lucide-react";
import type { SyncStatus } from "@/lib/sync";
import type { View } from "./NotesApp";
import ConfirmDialog from "./ConfirmDialog";

export default function Header({
  userEmail,
  view,
  status,
  onSignOut,
}: {
  userEmail: string;
  view: View;
  status: SyncStatus;
  onSignOut: () => void;
}) {
  const [confirmOut, setConfirmOut] = useState(false);
  const viewLabel = view === "upcoming" ? "Próximos" : "Todas";
  const initial = (userEmail[0] || "?").toUpperCase();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        <span className="text-slate-400">Notas</span>
        <ChevronRight className="h-4 w-4 text-slate-300" />
        <span className="font-semibold text-slate-800">{viewLabel}</span>
      </nav>

      <div className="flex items-center gap-4">
        <SyncBadge status={status} />

        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
            {initial}
          </span>
          <span className="hidden max-w-[180px] truncate text-sm text-slate-600 sm:block">
            {userEmail}
          </span>
        </div>

        <button
          onClick={() => setConfirmOut(true)}
          title="Sair"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:block">Sair</span>
        </button>
      </div>

      <ConfirmDialog
        open={confirmOut}
        title="Sair da conta"
        message="Deseja realmente sair? A cópia local será limpa deste dispositivo."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        onConfirm={() => {
          setConfirmOut(false);
          onSignOut();
        }}
        onCancel={() => setConfirmOut(false)}
      />
    </header>
  );
}

function SyncBadge({ status }: { status: SyncStatus }) {
  const { online, syncing, lastError } = status;
  let label = "Sincronizado";
  let color = "bg-green-500";
  if (!online) {
    label = "Offline";
    color = "bg-slate-400";
  } else if (syncing) {
    label = "Sincronizando…";
    color = "bg-amber-500";
  } else if (lastError) {
    label = "Erro ao sincronizar";
    color = "bg-red-500";
  }
  return (
    <span
      title={lastError ?? label}
      className="hidden items-center gap-1.5 text-xs text-slate-500 md:flex"
    >
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
