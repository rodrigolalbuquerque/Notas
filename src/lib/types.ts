// Modelo de uma nota. Espelhado entre Postgres (Supabase) e IndexedDB (Dexie).
export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string; // markdown
  tags: string[];
  remind_at: string | null; // ISO timestamp ou null
  created_at: string; // ISO
  updated_at: string; // ISO — base do last-write-wins
  deleted_at: string | null; // ISO — soft delete
}

// Campos extras que só existem na cópia local (Dexie), nunca vão pro servidor.
export interface LocalNote extends Note {
  // 1 = precisa ser enviada ao servidor; 0 = já sincronizada.
  dirty: 0 | 1;
}

export type NoteDraft = Pick<
  Note,
  "title" | "content" | "tags" | "remind_at"
>;
