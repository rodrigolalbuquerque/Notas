import type { LocalNote } from "./types";

export type TagMode = "and" | "or";

export interface NoteFilter {
  search: string;
  selectedTags: string[];
  mode: TagMode;
}

// Aplica busca por texto + filtro de tags (interseção/união) na cópia local.
export function filterNotes(
  notes: LocalNote[],
  { search, selectedTags, mode }: NoteFilter,
): LocalNote[] {
  const q = search.trim().toLowerCase();
  const tags = selectedTags;

  return notes.filter((note) => {
    // Nunca mostra soft-deletes.
    if (note.deleted_at) return false;

    // Filtro de tags.
    if (tags.length > 0) {
      const has = (t: string) => note.tags.includes(t);
      const matchTags =
        mode === "and" ? tags.every(has) : tags.some(has);
      if (!matchTags) return false;
    }

    // Busca textual em título, conteúdo e tags.
    if (q) {
      const haystack = `${note.title}\n${note.content}\n${note.tags.join(
        " ",
      )}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}

// Extrai o catálogo de tags (com contagem) a partir das notas ativas.
export function collectTags(
  notes: LocalNote[],
): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const note of notes) {
    if (note.deleted_at) continue;
    for (const t of note.tags) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
