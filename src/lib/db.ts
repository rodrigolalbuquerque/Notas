import Dexie, { type EntityTable } from "dexie";
import type { LocalNote } from "./types";

// Banco local (IndexedDB) que espelha a tabela `notes` do Supabase.
// Guarda também um pouco de metadado de sincronização.
const db = new Dexie("notas") as Dexie & {
  notes: EntityTable<LocalNote, "id">;
  meta: EntityTable<{ key: string; value: string }, "key">;
};

db.version(1).stores({
  // Índices: por atualização, por flag de pendência e multiEntry em tags.
  notes: "id, updated_at, dirty, remind_at, *tags",
  meta: "key",
});

export { db };

// Helpers para o cursor de última sincronização (guardado em `meta`).
export async function getLastSyncedAt(): Promise<string | null> {
  const row = await db.meta.get("lastSyncedAt");
  return row?.value ?? null;
}

export async function setLastSyncedAt(iso: string): Promise<void> {
  await db.meta.put({ key: "lastSyncedAt", value: iso });
}

// Limpa tudo (usado no logout para não vazar dados entre contas).
export async function clearLocalDb(): Promise<void> {
  await db.transaction("rw", db.notes, db.meta, async () => {
    await db.notes.clear();
    await db.meta.clear();
  });
}
