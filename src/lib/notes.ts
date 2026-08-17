import { db } from "./db";
import type { LocalNote, NoteDraft } from "./types";
import { requestSync } from "./sync";

// updated_at monotônico: nunca anda pra trás para uma mesma nota. Evita que a
// nota fique "pulando de posição" ao editar (por diferença de relógio entre
// cliente e servidor). Sempre em ISO canônico (…Z).
function nextUpdatedAt(prev?: string | null): string {
  const now = Date.now();
  const prevMs = prev ? Date.parse(prev) : 0;
  const ms = Number.isNaN(prevMs) ? now : Math.max(now, prevMs + 1);
  return new Date(ms).toISOString();
}

// Gera um UUID no cliente (as escritas nascem locais e offline-first).
function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback simples.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Cria uma nota localmente e agenda o envio ao servidor.
export async function createNote(
  userId: string,
  draft: NoteDraft,
): Promise<LocalNote> {
  const now = new Date().toISOString();
  const note: LocalNote = {
    id: uuid(),
    user_id: userId,
    title: draft.title,
    content: draft.content,
    tags: normalizeTags(draft.tags),
    remind_at: draft.remind_at,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    dirty: 1,
  };
  await db.notes.put(note);
  requestSync();
  return note;
}

// Atualiza campos de uma nota; marca como pendente e reenvia.
export async function updateNote(
  id: string,
  patch: Partial<NoteDraft>,
): Promise<void> {
  const existing = await db.notes.get(id);
  if (!existing) return;
  const updated: LocalNote = {
    ...existing,
    ...patch,
    tags: patch.tags ? normalizeTags(patch.tags) : existing.tags,
    updated_at: nextUpdatedAt(existing.updated_at),
    dirty: 1,
  };
  await db.notes.put(updated);
  requestSync();
}

// Soft delete: marca deleted_at para propagar a remoção no sync.
export async function deleteNote(id: string): Promise<void> {
  const existing = await db.notes.get(id);
  if (!existing) return;
  const ts = nextUpdatedAt(existing.updated_at);
  await db.notes.put({
    ...existing,
    deleted_at: ts,
    updated_at: ts,
    dirty: 1,
  });
  requestSync();
}

// Normaliza tags: minúsculas, sem espaços nas pontas, únicas, sem vazias.
export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  for (const raw of tags) {
    const t = raw.trim().toLowerCase();
    if (t) seen.add(t);
  }
  return [...seen].sort();
}
