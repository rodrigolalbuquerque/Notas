"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft } from "lucide-react";
import type { LocalNote, NoteDraft } from "@/lib/types";
import TagsInput from "./TagsInput";
import ConfirmDialog from "./ConfirmDialog";

// Converte ISO -> valor de <input type="datetime-local"> no fuso local.
function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

export default function NoteEditor({
  note,
  allTags,
  onSave,
  onDelete,
  onBack,
  className = "",
}: {
  note: LocalNote | null;
  allTags: string[];
  onSave: (id: string, patch: Partial<NoteDraft>) => void;
  onDelete: (id: string) => void;
  onBack?: () => void;
  className?: string;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [remindAt, setRemindAt] = useState("");
  // Notas com conteúdo abrem em leitura; notas novas/vazias abrem em edição.
  const [preview, setPreview] = useState(
    () => !!(note?.title || note?.content),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const saveTimer = useRef<number | null>(null);

  // Recarrega o formulário SÓ quando muda a nota selecionada (pelo id).
  // Depender do objeto `note` inteiro faria o autosave sobrescrever o texto
  // enquanto você digita (o Dexie recria o objeto a cada salvamento).
  useEffect(() => {
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
    setTags(note?.tags ?? []);
    setRemindAt(isoToLocalInput(note?.remind_at ?? null));
    setPreview(!!(note?.title || note?.content));
    setConfirmOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id]);

  // Autosave com debounce (300ms) — só quando os campos realmente mudam.
  // Se nada mudou (ex.: apenas abrir/visualizar a nota), não salvamos, para
  // não bumpar o updated_at e reordenar a lista sem necessidade.
  useEffect(() => {
    if (!note) return;

    const remindIso = localInputToIso(remindAt);
    const sameTags =
      tags.length === note.tags.length &&
      tags.every((t, i) => t === note.tags[i]);
    const unchanged =
      title === note.title &&
      content === note.content &&
      sameTags &&
      remindIso === (note.remind_at ?? null);
    if (unchanged) return;

    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      onSave(note.id, { title, content, tags, remind_at: remindIso });
    }, 300);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, tags, remindAt, note]);

  if (!note) {
    return (
      <section
        className={`${className} min-h-0 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm`}
      >
        Selecione ou crie uma nota
      </section>
    );
  }

  return (
    <section
      className={`${className} min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Voltar para a lista"
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          )}
          <button
            onClick={() => setPreview((p) => !p)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            {preview ? "Editar" : "Concluir"}
          </button>
        </div>
        <button
          onClick={() => setConfirmOpen(true)}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          Excluir
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {preview ? (
          // Modo leitura: nota renderizada (read-only).
          <article>
            <h1 className="text-2xl font-semibold text-slate-800">
              {title || "(sem título)"}
            </h1>

            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {remindAt && (
              <div className="mt-2 text-sm text-amber-600">
                ⏰ {new Date(remindAt).toLocaleString("pt-BR")}
              </div>
            )}

            <div className="prose-notas mt-4 max-w-none text-sm leading-relaxed text-slate-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || "*Nota vazia. Clique em Editar para começar.*"}
              </ReactMarkdown>
            </div>
          </article>
        ) : (
          // Modo edição: formulário.
          <>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título"
              className="w-full bg-transparent text-2xl font-semibold text-slate-800 outline-none placeholder:text-slate-300"
            />

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <div className="flex-1 text-xs text-slate-500">
                Tags (vírgula ou espaço para adicionar)
                <TagsInput
                  value={tags}
                  suggestions={allTags}
                  onChange={setTags}
                />
              </div>
              <label className="text-xs text-slate-500">
                Lembrete (opcional)
                <input
                  type="datetime-local"
                  value={remindAt}
                  onChange={(e) => setRemindAt(e.target.value)}
                  className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-indigo-500"
                />
              </label>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva em Markdown…"
              className="mt-4 h-[50vh] w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-slate-700 outline-none placeholder:text-slate-300"
            />
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir nota"
        message="Tem certeza que deseja excluir esta nota? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete(note.id);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
}
