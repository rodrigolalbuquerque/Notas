"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/client";
import { clearLocalDb } from "@/lib/db";
import { startSyncTriggers, onSyncStatus, type SyncStatus } from "@/lib/sync";
import { createNote, deleteNote, updateNote } from "@/lib/notes";
import { collectTags, filterNotes, type TagMode } from "@/lib/filter";
import type { NoteDraft } from "@/lib/types";
import Sidebar from "./Sidebar";
import Header from "./Header";
import FiltersCard from "./FiltersCard";
import NoteList from "./NoteList";
import NoteEditor from "./NoteEditor";

export type View = "all" | "upcoming";

export default function NotesApp({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail: string;
}) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mode, setMode] = useState<TagMode>("or");
  const [view, setView] = useState<View>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<SyncStatus>({
    syncing: false,
    online: true,
    lastError: null,
  });

  // Liga sincronização automática (login/online/intervalo/visibilidade).
  useEffect(() => {
    const stopTriggers = startSyncTriggers();
    const stopStatus = onSyncStatus(setStatus);
    return () => {
      stopTriggers();
      stopStatus();
    };
  }, []);

  // Leitura reativa da cópia local — atualiza sozinha a cada mudança no Dexie.
  const allNotes = useLiveQuery(
    () => db.notes.orderBy("updated_at").reverse().toArray(),
    [],
    [],
  );

  const tags = useMemo(() => collectTags(allNotes), [allNotes]);

  const visibleNotes = useMemo(() => {
    let notes = filterNotes(allNotes, { search, selectedTags, mode });
    if (view === "upcoming") {
      const now = Date.now();
      notes = notes
        .filter((n) => n.remind_at && new Date(n.remind_at).getTime() >= now)
        .sort(
          (a, b) =>
            new Date(a.remind_at!).getTime() - new Date(b.remind_at!).getTime(),
        );
    }
    return notes;
  }, [allNotes, search, selectedTags, mode, view]);

  const selectedNote = useMemo(
    () => allNotes.find((n) => n.id === selectedId && !n.deleted_at) ?? null,
    [allNotes, selectedId],
  );

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleCreate() {
    const note = await createNote(userId, {
      title: "",
      content: "",
      tags: selectedTags, // já entra com as tags do filtro atual
      remind_at: null,
    });
    setSelectedId(note.id);
  }

  async function handleSave(id: string, patch: Partial<NoteDraft>) {
    await updateNote(id, patch);
  }

  async function handleDelete(id: string) {
    await deleteNote(id);
    if (selectedId === id) setSelectedId(null);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    await clearLocalDb();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 text-slate-800">
      <Sidebar
        tags={tags}
        selectedTags={selectedTags}
        mode={mode}
        view={view}
        onToggleTag={toggleTag}
        onClearTags={() => setSelectedTags([])}
        onModeChange={setMode}
        onViewChange={setView}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          userEmail={userEmail}
          view={view}
          status={status}
          onSignOut={handleSignOut}
        />

        <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
          <FiltersCard
            search={search}
            selectedTags={selectedTags}
            mode={mode}
            onSearchChange={setSearch}
            onToggleTag={toggleTag}
            onCreate={handleCreate}
          />

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
            <NoteList
              notes={visibleNotes}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onCreate={handleCreate}
            />

            <NoteEditor
              key={selectedNote?.id ?? "empty"}
              note={selectedNote}
              allTags={tags.map((t) => t.tag)}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
