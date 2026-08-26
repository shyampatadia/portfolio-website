import { useEffect, useMemo, useRef, useState } from "react";

export function CommandPalette({ open, onClose, commands }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter((command) =>
      `${command.label} ${command.hint || ""}`.toLowerCase().includes(needle),
    );
  }, [commands, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setIndex(0);
    // Focus lands after the element is painted, or the keystroke is swallowed.
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    setIndex(0);
  }, [query]);

  useEffect(() => {
    const active = listRef.current?.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: "nearest" });
  }, [index, matches]);

  if (!open) return null;

  function onKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIndex((value) => (matches.length ? (value + 1) % matches.length : 0));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIndex((value) => (matches.length ? (value - 1 + matches.length) % matches.length : 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const command = matches[index];
      if (command) {
        onClose();
        command.run();
      }
    }
  }

  return (
    <div
      className="palette-scrim"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <input
          ref={inputRef}
          className="palette-input"
          placeholder="Jump to, or run a command"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-autocomplete="list"
        />
        <div className="palette-list" id="palette-list" role="listbox" ref={listRef}>
          {matches.length === 0 && (
            <p className="panel-note" style={{ padding: "0.75rem 0.65rem" }}>
              No command matches that.
            </p>
          )}
          {matches.map((command, position) => {
            const Icon = command.icon;
            return (
              <button
                key={command.id}
                type="button"
                role="option"
                aria-selected={position === index}
                data-active={position === index}
                className="palette-item"
                onMouseEnter={() => setIndex(position)}
                onClick={() => {
                  onClose();
                  command.run();
                }}
              >
                {Icon && <Icon />}
                {command.label}
                {command.shortcut && <kbd>{command.shortcut}</kbd>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
