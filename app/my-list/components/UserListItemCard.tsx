'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';

export type ListItemId = string | number;

export type UserListItemDTO = {
  id: ListItemId;
  text: string;
  done: boolean;
  order: number;
  resetRuleJson?: string | null;
};

function idToString(id: ListItemId) {
  return typeof id === 'string' ? id : String(id);
}

export default function UserListItemCard({
  item,
  selected,
  bulkMode,
  onToggleSelect,
  onToggleDone,
  onChangeText,
  onRemove,
}: {
  item: UserListItemDTO;
  selected: boolean;
  bulkMode: boolean;
  onToggleSelect: (id: ListItemId) => void;
  onToggleDone: (id: ListItemId, next: boolean) => void;
  onChangeText: (id: ListItemId, nextText: string) => void;
  onRemove: (id: ListItemId) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setDraft(item.text), [item.text]);

  useEffect(() => {
    if (!editing) return;
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, [editing]);

  const key = useMemo(() => idToString(item.id), [item.id]);

  return (
    <div
      className={[
        'relative rounded-2xl border overflow-hidden',
        'bg-white/10 border-white/10 backdrop-blur-xl',
        selected ? 'ring-2 ring-purple-300/40' : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {bulkMode ? (
          <button
            className={[
              'w-6 h-6 rounded-md border flex items-center justify-center',
              selected ? 'bg-purple-500/30 border-purple-300/60' : 'border-white/25 bg-white/5',
            ].join(' ')}
            onClick={() => onToggleSelect(item.id)}
            aria-label="Selecionar item"
            title="Selecionar item"
          >
            {selected ? '✓' : ''}
          </button>
        ) : (
          <button
            className={[
              'w-6 h-6 rounded-md border flex items-center justify-center transition-all',
              item.done
                ? 'border-emerald-300 bg-emerald-300/20 text-emerald-100'
                : 'border-white/25 text-white/50 hover:border-white/45 hover:text-white/80',
            ].join(' ')}
            onClick={() => onToggleDone(item.id, !item.done)}
            aria-label={item.done ? 'Desmarcar' : 'Marcar como feito'}
            title={item.done ? 'Desmarcar' : 'Marcar como feito'}
          >
            {item.done ? '✓' : ''}
          </button>
        )}

        <div className="flex-1 min-w-0">
          {!editing ? (
            <button
              className={[
                'w-full text-left truncate',
                'text-white font-semibold',
                item.done ? 'opacity-70 line-through' : '',
              ].join(' ')}
              onDoubleClick={() => setEditing(true)}
              title="Duplo clique para editar"
            >
              {item.text}
            </button>
          ) : (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                setEditing(false);
                const next = draft.trim();
                if (next && next !== item.text) onChangeText(item.id, next);
                else setDraft(item.text);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.currentTarget as HTMLInputElement).blur();
                }
                if (e.key === 'Escape') {
                  setDraft(item.text);
                  setEditing(false);
                }
              }}
              className="w-full bg-black/20 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Editar item…"
            />
          )}

          <div className="text-xs text-white/45 mt-1">
            ID: {key}
          </div>
        </div>

        <div className="relative">
          <button
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white flex items-center justify-center"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Opções"
            title="Opções"
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen ? (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-black/75 backdrop-blur-xl shadow-xl overflow-hidden z-20">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                onClick={() => {
                  setMenuOpen(false);
                  setEditing(true);
                }}
              >
                Editar texto
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-200 hover:bg-white/10"
                onClick={() => {
                  setMenuOpen(false);
                  onRemove(item.id);
                }}
              >
                <Trash2 size={16} />
                Remover
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
