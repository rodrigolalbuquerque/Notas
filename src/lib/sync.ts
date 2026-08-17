import { createClient } from "./supabase/client";
import { db, getLastSyncedAt, setLastSyncedAt } from "./db";
import type { LocalNote, Note } from "./types";

// Campos que existem no servidor (sem os metadados locais como `dirty`).
const SERVER_COLUMNS =
  "id,user_id,title,content,tags,remind_at,created_at,updated_at,deleted_at";

function toServerRow(n: LocalNote): Note {
  const { dirty: _dirty, ...row } = n;
  void _dirty;
  return row;
}

let syncing = false;
let pending = false;
const listeners = new Set<(status: SyncStatus) => void>();

export type SyncStatus = {
  syncing: boolean;
  online: boolean;
  lastError: string | null;
};

let lastError: string | null = null;

function emit() {
  const status: SyncStatus = {
    syncing,
    online: typeof navigator === "undefined" ? true : navigator.onLine,
    lastError,
  };
  listeners.forEach((l) => l(status));
}

export function onSyncStatus(cb: (s: SyncStatus) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Agenda uma sincronização; coalesce chamadas para evitar corridas.
export function requestSync(): void {
  if (syncing) {
    pending = true;
    return;
  }
  void runSync();
}

async function runSync(): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  syncing = true;
  lastError = null;
  emit();
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await push(supabase, user.id);
    await pull(supabase);
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
  } finally {
    syncing = false;
    emit();
    if (pending) {
      pending = false;
      void runSync();
    }
  }
}

// PUSH: envia todas as notas pendentes (dirty) via upsert.
async function push(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<void> {
  const dirty = await db.notes.where("dirty").equals(1).toArray();
  if (dirty.length === 0) return;

  const rows = dirty.map((n) => ({ ...toServerRow(n), user_id: userId }));
  const { error } = await supabase.from("notes").upsert(rows);
  if (error) throw error;

  // Limpa a flag apenas das notas que não mudaram durante o envio.
  await db.transaction("rw", db.notes, async () => {
    for (const n of dirty) {
      const current = await db.notes.get(n.id);
      if (current && current.updated_at === n.updated_at) {
        await db.notes.put({ ...current, dirty: 0 });
      }
    }
  });
}

// PULL: traz tudo que mudou no servidor desde o último sync (last-write-wins).
async function pull(
  supabase: ReturnType<typeof createClient>,
): Promise<void> {
  const since = await getLastSyncedAt();
  let query = supabase
    .from("notes")
    .select(SERVER_COLUMNS)
    .order("updated_at", { ascending: true });
  if (since) query = query.gt("updated_at", since);

  const { data, error } = await query.returns<Note[]>();
  if (error) throw error;
  if (!data || data.length === 0) return;

  let maxUpdated = since ?? "";
  let maxUpdatedMs = since ? Date.parse(since) : 0;
  await db.transaction("rw", db.notes, async () => {
    for (const remote of data) {
      const remoteMs = Date.parse(remote.updated_at);
      // Cursor pelo maior instante (o servidor entende qualquer ISO no .gt()).
      if (remoteMs > maxUpdatedMs) {
        maxUpdatedMs = remoteMs;
        maxUpdated = remote.updated_at;
      }

      // Normaliza o updated_at para ISO canônico (…Z), para a ordenação e as
      // comparações locais serem sempre por instante, não por string.
      const normalized = {
        ...remote,
        updated_at: new Date(remoteMs).toISOString(),
      };

      const local = await db.notes.get(remote.id);
      // Só sobrescreve se o servidor for igual/mais novo (comparação por
      // instante). Local pendente com versão mais recente é preservada.
      if (!local || remoteMs >= Date.parse(local.updated_at)) {
        if (remote.deleted_at) {
          await db.notes.delete(remote.id);
        } else {
          await db.notes.put({ ...normalized, dirty: 0 });
        }
      }
    }
  });

  if (maxUpdated) await setLastSyncedAt(maxUpdated);
}

// Liga os gatilhos automáticos de sincronização (chamado uma vez no app).
export function startSyncTriggers(): () => void {
  const onOnline = () => requestSync();
  const onVisible = () => {
    if (document.visibilityState === "visible") requestSync();
  };
  window.addEventListener("online", onOnline);
  document.addEventListener("visibilitychange", onVisible);
  const interval = window.setInterval(() => requestSync(), 60_000);

  requestSync(); // primeira sincronização

  return () => {
    window.removeEventListener("online", onOnline);
    document.removeEventListener("visibilitychange", onVisible);
    window.clearInterval(interval);
  };
}
