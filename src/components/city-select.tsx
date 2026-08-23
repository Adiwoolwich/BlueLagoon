import { useEffect, useId, useMemo, useRef, useState } from "react";
import { findCity, searchCities, CITIES, type City } from "@/lib/cities";
import { cn } from "@/lib/utils";

export function CitySelect({
  value,
  onChange,
  label,
  placeholder = "Stadt wählen …",
  allowEmpty = true,
}: {
  value: string;
  onChange: (name: string) => void;
  label?: string;
  placeholder?: string;
  allowEmpty?: boolean;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [active, setActive] = useState(0);
  const resolved = findCity(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const matches = useMemo(() => searchCities(draft, 14), [draft]);

  function pick(city: City) {
    onChange(city.name);
    setDraft(city.name);
    setOpen(false);
  }

  function clear() {
    onChange("");
    setDraft("");
    setOpen(true);
    inputRef.current?.focus();
  }

  function commitOrWarn() {
    const exact = findCity(draft);
    if (exact) {
      onChange(exact.name);
      setDraft(exact.name);
    } else if (draft.trim() && !allowEmpty) {
      onChange("");
    }
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      {label ? (
        <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted">
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          "flex h-11 items-center gap-2 rounded-xl bg-surface px-3 shadow-border",
          open && "ring-2 ring-primary/50",
        )}
      >
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          value={draft}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          onFocus={() => {
            setOpen(true);
            setActive(0);
          }}
          onBlur={() => {
            window.setTimeout(commitOrWarn, 120);
          }}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
            setActive(0);
            if (!e.target.value) onChange("");
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(i + 1, Math.max(0, matches.length - 1)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (matches[active]) pick(matches[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-subtle md:text-sm"
        />
        {allowEmpty && (value || draft) ? (
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={clear} className="grid size-7 place-items-center text-muted" aria-label="Ort löschen">
            ×
          </button>
        ) : null}
      </div>
      {open ? (
        <ul id={listId} role="listbox" className="absolute z-50 mt-1 max-h-[min(18rem,42dvh)] w-full overflow-y-auto rounded-xl bg-bg-elevated py-1 shadow-panel ring-1 ring-border-strong">
          {matches.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted">Keine Treffer in {CITIES.length} Städten.</li>
          ) : (
            matches.map((c, i) => (
              <li key={c.name}>
                <button
                  type="button"
                  role="option"
                  aria-selected={c.name === resolved?.name}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(c)}
                  className={cn(
                    "flex min-h-11 w-full items-center px-3 py-2.5 text-left text-sm",
                    i === active ? "bg-surface-2 text-fg" : "text-fg hover:bg-surface",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{c.name}</span>
                    <span className="block truncate text-xs text-muted">{c.state}</span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
