"use client";

import { useMemo, useRef, useState } from "react";

// Normaliza igual ao servidor: minúsculas e sem espaços nas pontas.
function norm(raw: string): string {
  return raw.trim().toLowerCase();
}

export default function TagsInput({
  value,
  suggestions,
  onChange,
}: {
  value: string[];
  suggestions: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sugestões: tags existentes que combinam com o texto e ainda não foram usadas.
  const matches = useMemo(() => {
    const q = norm(input);
    return suggestions
      .filter((s) => !value.includes(s))
      .filter((s) => (q ? s.includes(q) : true))
      .slice(0, 8);
  }, [input, suggestions, value]);

  function addTag(raw: string) {
    const tag = norm(raw);
    if (!tag) return;
    if (!value.includes(tag)) onChange([...value, tag]);
    setInput("");
    setActive(0);
    setOpen(false);
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Vírgula, espaço ou Enter confirmam a tag digitada (ou a sugestão ativa).
    if (e.key === "," || e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (open && matches[active]) {
        addTag(matches[active]);
      } else {
        addTag(input);
      }
      return;
    }
    // Tab aplica a sugestão ativa (a primeira, por padrão), como o Enter.
    // Só intercepta o Tab quando há sugestão; senão deixa mudar de campo.
    if (e.key === "Tab" && open && input.trim() && matches[active]) {
      e.preventDefault();
      addTag(matches[active]);
      return;
    }
    // Backspace com input vazio remove a última tag.
    if (e.key === "Backspace" && input === "" && value.length > 0) {
      e.preventDefault();
      removeTag(value[value.length - 1]);
      return;
    }
    if (e.key === "ArrowDown" && matches.length > 0) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % matches.length);
      return;
    }
    if (e.key === "ArrowUp" && matches.length > 0) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a - 1 + matches.length) % matches.length);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <div
        onClick={() => inputRef.current?.focus()}
        className="mt-1 flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5 focus-within:border-indigo-500"
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
          >
            #{tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              aria-label={`Remover ${tag}`}
              className="text-indigo-400 hover:text-indigo-700"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          // Confirma texto pendente ao sair (delay p/ permitir clique na sugestão).
          onBlur={() => {
            setTimeout(() => {
              setOpen(false);
              if (input.trim()) addTag(input);
            }, 120);
          }}
          placeholder={value.length === 0 ? "whatsapp, custos" : ""}
          className="min-w-[8ch] flex-1 bg-transparent py-0.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>

      {open && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {matches.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                // mousedown evita o blur do input antes do clique.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(s)}
                onMouseEnter={() => setActive(i)}
                className={`block w-full px-3 py-1.5 text-left text-sm text-slate-700 ${
                  i === active ? "bg-slate-100" : "hover:bg-slate-100"
                }`}
              >
                #{s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
