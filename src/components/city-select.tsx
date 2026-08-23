import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, MapPin, X } from "lucide-react";
import { findCity, searchCities, CITIES, cityKey, type City } from "@/lib/cities";
import { cn } from "@/lib/utils";

export function CitySelect({
  value,
  onChange,
  label,
  placeholder = "Stadt oder PLZ …",
  allowEmpty = true,
  warnUnmatched = true,
}: {
  value: string;
  onChange: (name: string) => void;
  label?: string;
  placeholder?: string;
  allowEmpty?: boolean;
  warnUnmatched?: boolean;
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
  const unmatched = draft.trim().length > 0 && !findCity(draft);

  function pick(city: City) {
    const next = cityKey(city);
    onChange(next);
    setDraft(city.postalCode ? `${city.postalCode} ${city.name}` : next);
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
          unmatched && open === false && draft.trim() && "ring-2 ring-bad/60",
        )}
      >
        <MapPin className="size-4 shrink-0 text-primary" />
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
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
            const v = e.target.value;
            setDraft(v);
            setOpen(true);
            setActive(0);
            onChange(v);
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
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clear}
            className="grid size-7 place-items-center rounded-md text-muted hover:text-fg"
            aria-label="Ort löschen"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setOpen((o) => !o);
            inputRef.current?.focus();
          }}
          className="grid size-8 place-items-center rounded-md bg-surface-2 text-muted hover:text-fg"
          aria-label="Städte anzeigen"
        >
          <ChevronDown className={cn("size-4 transition-transform duration-150", open && "rotate-180")} />
        </button>
      </div>
      {warnUnmatched && unmatched && !open ? (
        <p className="mt-1 text-xs text-bad">
          Kein Ort gefunden. Stadt, Ortsteil oder PLZ eingeben.
        </p>
      ) : null}
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-[min(18rem,42dvh)] w-full overflow-y-auto rounded-xl bg-bg-elevated py-1 shadow-panel ring-1 ring-border-strong"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted">
              Keine Treffer in {CITIES.length} Orten. Stadt, Ortsteil oder PLZ versuchen.
            </li>
          ) : (
            <>
              {unmatched ? (
                <li className="px-3 py-1.5 text-[11px] tracking-wide text-stale uppercase">
                  Meintest du …
                </li>
              ) : !draft.trim() ? (
                <li className="px-3 py-1.5 text-[11px] tracking-wide text-muted uppercase">
                  Häufige Ziele
                </li>
              ) : null}
              {matches.map((c, i) => {
                const selected = cityKey(c) === (resolved ? cityKey(resolved) : value);
                return (
                  <li key={`${c.name}-${c.state}-${c.postalCode ?? i}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => pick(c)}
                      className={cn(
                        "flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm",
                        i === active ? "bg-surface-2 text-fg" : "text-fg hover:bg-surface",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {c.postalCode ? `${c.postalCode} ${c.name}` : c.name}
                        </span>
                        <span className="block truncate text-xs text-muted">{c.state}</span>
                      </span>
                      {selected ? <Check className="size-4 shrink-0 text-primary" /> : null}
                    </button>
                  </li>
                );
              })}
              <li className="border-t border-border px-3 py-1.5 text-[11px] text-subtle">
                {CITIES.length.toLocaleString("de-DE")} Orte · PLZ-Suche
              </li>
            </>
          )}
        </ul>
      ) : null}
    </div>
  );
}
