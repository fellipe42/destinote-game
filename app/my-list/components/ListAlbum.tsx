'use client';

import { useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';

export type UserListId = string | number;

export type UserListItemDTO = {
  id: UserListId;
  text: string;
  done: boolean;
  order: number;
};

export type UserListDTO = {
  id: UserListId;
  name: string;
  templateId?: string | null;
  appearanceJson: string;
  resetRuleJson?: string | null;
  items: UserListItemDTO[];
};

function idEq(a: UserListId, b: UserListId) {
  return String(a) === String(b);
}

function previewSrcForTemplate(templateId?: string | null) {
  // você pode mapear ids reais -> previews específicos depois
  if (!templateId) return '/images/list-templates/weekly.png';
  if (templateId.includes('morning')) return '/images/list-templates/morning.png';
  if (templateId.includes('minimal')) return '/images/list-templates/minimal.png';
  if (templateId.includes('daily')) return '/images/list-templates/daily.png';
  return '/images/list-templates/weekly.png';
}

export default function ListAlbum({
  lists,
  activeListId,
  onOpenList,
  onRenameList,
}: {
  lists: UserListDTO[];
  activeListId: UserListId | null;
  onOpenList: (id: UserListId) => void;
  onRenameList: (id: UserListId, name: string) => void;
}) {
  const [editingId, setEditingId] = useState<UserListId | null>(null);
  const [draft, setDraft] = useState('');

  const sorted = useMemo(() => {
    return [...lists].sort((a, b) => (String(a.id) > String(b.id) ? -1 : 1));
  }, [lists]);

  return (
    <div className="rounded-3xl border border-white/10 bg-black/35 backdrop-blur-xl p-4">
      <div className="text-white font-semibold mb-3">Álbum de listas</div>

      {sorted.length === 0 ? (
        <div className="text-white/65 text-sm">
          Você ainda não criou listas. Aperta “Criar nova lista” ali em cima e seja feliz.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sorted.map((l) => {
            const active = activeListId != null && idEq(l.id, activeListId);
            const preview = previewSrcForTemplate(l.templateId);

            return (
              <button
                key={String(l.id)}
                onClick={() => onOpenList(l.id)}
                className={[
                  'text-left rounded-3xl border overflow-hidden transition',
                  active
                    ? 'border-purple-300/35 bg-white/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10',
                ].join(' ')}
              >
                <div className="relative h-24 w-full overflow-hidden">
                  <img
                    src={preview}
                    alt="Template preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-85"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/25 to-black/60" />
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {editingId != null && idEq(editingId, l.id) ? (
                        <input
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onBlur={() => {
                            const next = draft.trim();
                            setEditingId(null);
                            if (next && next !== l.name) onRenameList(l.id, next);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="w-full rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/20"
                        />
                      ) : (
                        <div className="text-white font-semibold truncate" title={l.name}>
                          {l.name}
                        </div>
                      )}

                      <div className="text-xs text-white/55 mt-1">
                        {l.items?.length ?? 0} item(s)
                      </div>
                    </div>

                    <button
                      type="button"
                      className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(l.id);
                        setDraft(l.name);
                      }}
                      aria-label="Renomear lista"
                      title="Renomear lista"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
