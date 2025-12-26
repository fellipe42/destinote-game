'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Sparkles, Eye, EyeOff, ListPlus, Trash2 } from 'lucide-react';

import Navbar from '@/components/Navbar';
import StaticBackground from '@/components/my-list/StaticBackground';

import MyListCard from './components/MyListCard';
import ListAlbum, { type UserListDTO, type UserListId } from './components/ListAlbum';
import CreateListModal from './components/CreateListModal';
import PersonalizeDrawer from './components/PersonalizeDrawer';
import ExportControlsV2 from './components/ExportControlsV2';
import UndoToast, { type UndoPayload } from './components/UndoToast';

import ExportPreview, {
    type ExportAppearance,
    type PreviewItem,
} from './components/ExportPreview';

import BulkActionsBar from './components/BulkActionsBar';
import UserListItemCard, { type UserListItemDTO, type ListItemId } from './components/UserListItemCard';

export type CategoryDTO = {
    id: number;
    name: string;
    color?: string | null;
};

export type GoalDTO = {
    id: number;
    title: string;
    local?: string | null;
    done: boolean;
    category?: CategoryDTO | null;
};

function idEq(a: UserListId | null | undefined, b: UserListId | null | undefined) {
    if (a == null || b == null) return false;
    return String(a) === String(b);
}

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
    try {
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function emitListChanged() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event('destinote:list-changed'));
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as T;
    if (!res.ok) throw new Error((json as any)?.error ?? 'Erro');
    return json;
}

async function patchJson<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as T;
    if (!res.ok) throw new Error((json as any)?.error ?? 'Erro');
    return json;
}

const DEFAULT_EXPORT_APPEARANCE: ExportAppearance = {
    preset: 'neon',
    transparent: false,
    globeEnabled: true,
    globeId: 'earth',
    globeRotationDeg: 18,
    globeBrightness: 1,
    globeScale: 1,
    format: 'story',
    layout: 'cards',
    density: 'compact',
    maxItems: 16,
    showChecks: true,
    cardOpacity: 0.95,
    cardRadius: 18,
};

export default function MyListClient({
    initialGoals,
    initialLists,
    initialActiveListId,
}: {
    initialGoals: GoalDTO[];
    initialLists: UserListDTO[];
    initialActiveListId: UserListId | null;
}) {
    const router = useRouter();
    const sp = useSearchParams();

    const [tab, setTab] = useState<'goals' | 'lists'>(() => {
        const t = sp.get('tab');
        return t === 'lists' ? 'lists' : 'goals';
    });

    const [previewOn, setPreviewOn] = useState(false);

    // goals (bucket list)
    const [goals, setGoals] = useState<GoalDTO[]>(initialGoals);

    // custom lists
    const [lists, setLists] = useState<UserListDTO[]>(initialLists);

    const [activeListId, setActiveListId] = useState<UserListId | null>(() => {
        const q = sp.get('list');
        if (q) return q;
        return initialActiveListId ?? (initialLists[0]?.id ?? null);
    });

    const activeList = useMemo(() => {
        if (!activeListId) return null;
        return lists.find((l) => idEq(l.id, activeListId)) ?? null;
    }, [lists, activeListId]);

    // export appearance: goals uses localStorage; lists use list.appearanceJson
    const [appearanceGoals, setAppearanceGoals] = useState<ExportAppearance>(() => {
        if (typeof window === 'undefined') return DEFAULT_EXPORT_APPEARANCE;
        const raw = localStorage.getItem('destinote:my-list:export-appearance:v1');
        return safeJsonParse(raw, DEFAULT_EXPORT_APPEARANCE);
    });

    const [appearanceList, setAppearanceList] = useState<ExportAppearance>(() => {
        const raw = activeList?.appearanceJson;
        return safeJsonParse(raw, DEFAULT_EXPORT_APPEARANCE);
    });

    useEffect(() => {
        const raw = activeList?.appearanceJson;
        setAppearanceList(safeJsonParse(raw, DEFAULT_EXPORT_APPEARANCE));
    }, [activeList?.appearanceJson]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem('destinote:my-list:export-appearance:v1', JSON.stringify(appearanceGoals));
        } catch { }
    }, [appearanceGoals]);

    // query-driven UX: /my-list?tab=lists&create=1
    const [createOpen, setCreateOpen] = useState(false);
    useEffect(() => {
        const create = sp.get('create');
        if (create === '1') setCreateOpen(true);
    }, [sp]);

    // Personalize Drawer
    const [personalizeOpen, setPersonalizeOpen] = useState(false);

    // Undo
    const [undo, setUndo] = useState<UndoPayload | null>(null);

    // Bulk (goals)
    const [bulkGoals, setBulkGoals] = useState(false);
    const [selectedGoalIds, setSelectedGoalIds] = useState<Set<number>>(new Set());

    // Bulk (list items)
    const [bulkItems, setBulkItems] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

    const currentAppearance = tab === 'goals' ? appearanceGoals : appearanceList;
    const setCurrentAppearance = tab === 'goals' ? setAppearanceGoals : setAppearanceList;

    const goalPreviewItems: PreviewItem[] = useMemo(() => {
        return goals.map((g) => ({ id: g.id, text: g.title, done: g.done }));
    }, [goals]);

    const listPreviewItems: PreviewItem[] = useMemo(() => {
        return (activeList?.items ?? []).map((it) => ({ id: it.id, text: it.text, done: it.done }));
    }, [activeList?.items]);

    const previewItems = tab === 'goals' ? goalPreviewItems : listPreviewItems;

    // ---------- GOALS actions ----------
    const toggleGoalDone = async (goalId: number, nextDone: boolean) => {
        // optimistic
        setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, done: nextDone } : g)));

        try {
            await postJson('/api/user/done', { goalId, done: nextDone });
            emitListChanged();
        } catch {
            // rollback
            setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, done: !nextDone } : g)));
        }
    };

    const removeGoalFromList = async (goalId: number) => {
        const removed = goals.find((g) => g.id === goalId);
        if (!removed) return;

        setGoals((prev) => prev.filter((g) => g.id !== goalId));

        try {
            await postJson('/api/user/add-to-list', { goalId, add: false });
            emitListChanged();

            setUndo({
                label: 'Objetivo removido da sua lista',
                payload: { kind: 'goals', items: [removed] },
            });
        } catch {
            // rollback
            setGoals((prev) => [removed, ...prev]);
        }
    };

    const enterBulkGoals = () => {
        setBulkGoals(true);
        setSelectedGoalIds(new Set());
    };
    const exitBulkGoals = () => {
        setBulkGoals(false);
        setSelectedGoalIds(new Set());
    };

    const toggleSelectGoal = (id: number) => {
        setSelectedGoalIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const bulkRemoveGoals = async () => {
        const ids = Array.from(selectedGoalIds);
        if (ids.length === 0) return;

        const removed = goals.filter((g) => selectedGoalIds.has(g.id));
        setGoals((prev) => prev.filter((g) => !selectedGoalIds.has(g.id)));
        exitBulkGoals();

        // remove via /add-to-list (batch leve)
        try {
            const chunk = 18;
            for (let i = 0; i < ids.length; i += chunk) {
                const slice = ids.slice(i, i + chunk);
                await Promise.all(
                    slice.map((goalId) => postJson('/api/user/add-to-list', { goalId, add: false }))
                );
            }
            emitListChanged();
            setUndo({
                label: `Removidos ${removed.length} objetivos`,
                payload: { kind: 'goals', items: removed },
            });
        } catch {
            // rollback total (simples)
            setGoals((prev) => [...removed, ...prev]);
        }
    };

    const bulkMarkDoneGoals = async () => {
        const ids = Array.from(selectedGoalIds);
        if (ids.length === 0) return;

        exitBulkGoals();
        // optimistic
        setGoals((prev) => prev.map((g) => (selectedGoalIds.has(g.id) ? { ...g, done: true } : g)));

        try {
            const chunk = 20;
            for (let i = 0; i < ids.length; i += chunk) {
                const slice = ids.slice(i, i + chunk);
                await Promise.all(slice.map((goalId) => postJson('/api/user/done', { goalId, done: true })));
            }
            emitListChanged();
        } catch {
            // rollback parcial não trivial — por segurança, refresh
            router.refresh();
        }
    };

    const removeAllGoals = async () => {
        if (goals.length === 0) return;
        const removed = goals;
        setGoals([]);

        try {
            const ids = removed.map((g) => g.id);
            const chunk = 18;
            for (let i = 0; i < ids.length; i += chunk) {
                const slice = ids.slice(i, i + chunk);
                await Promise.all(
                    slice.map((goalId) => postJson('/api/user/add-to-list', { goalId, add: false }))
                );
            }
            emitListChanged();
            setUndo({
                label: 'Lista limpa (removemos tudo)',
                payload: { kind: 'goals', items: removed },
            });
        } catch {
            setGoals(removed);
        }
    };

    // Undo handler (goals)
    const handleUndo = async () => {
        if (!undo) return;

        if (undo.payload.kind === 'goals') {
            const items = undo.payload.items;
            // optimistic
            setGoals((prev) => [...items, ...prev]);

            try {
                await postJson('/api/user/bulk-add-to-list', { goalIds: items.map((g) => g.id) });
                emitListChanged();
            } catch {
                router.refresh();
            }
        }

        setUndo(null);
    };

    // ---------- LISTS actions ----------
    const refreshLists = async () => {
        try {
            const res = await fetch('/api/user/lists', { cache: 'no-store' });
            const json = (await res.json().catch(() => ({}))) as any;
            if (json?.success && Array.isArray(json?.lists)) {
                setLists(json.lists);
                if (json.activeListId != null) setActiveListId(json.activeListId);
            }
        } catch { }
    };

    const openList = async (id: UserListId) => {
        setTab('lists');
        setActiveListId(id);
        try {
            // opcional (se existir)
            await postJson('/api/user/active-list', { listId: id });
        } catch { }
    };

    const createList = async (name: string, templateId?: string | null) => {
        try {
            const json = await postJson<any>('/api/user/lists', { name, templateId: templateId ?? null });
            if (json?.success && json?.list) {
                const created = json.list as UserListDTO;
                setLists((prev) => [created, ...prev]);
                setTab('lists');
                setActiveListId(created.id);
                emitListChanged();
                setCreateOpen(false);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const renameList = async (id: UserListId, nextName: string) => {
        setLists((prev) => prev.map((l) => (idEq(l.id, id) ? { ...l, name: nextName } : l)));
        try {
            await patchJson('/api/user/lists', { listId: id, name: nextName });
        } catch {
            refreshLists();
        }
    };

    // debounced save for list snapshot (items + appearance + reset)
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scheduleSaveList = (listId: UserListId, next: Partial<UserListDTO>) => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            try {
                await patchJson('/api/user/lists', { listId, ...next });
            } catch {
                // não trava UX — apenas tenta recuperar
                refreshLists();
            }
        }, 450);
    };

    const addItemToActiveList = (text: string) => {
        if (!activeList) return;
        const trimmed = text.trim();
        if (!trimmed) return;

        const tmpId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const nextItem: UserListItemDTO = {
            id: tmpId,
            text: trimmed,
            done: false,
            order: (activeList.items?.length ?? 0) + 1,
        };

        const nextList: UserListDTO = {
            ...activeList,
            items: [...(activeList.items ?? []), nextItem],
        };

        setLists((prev) => prev.map((l) => (idEq(l.id, activeList.id) ? nextList : l)));
        scheduleSaveList(activeList.id, { items: nextList.items } as any);
    };

    const toggleItemDone = (itemId: ListItemId, nextDone: boolean) => {
        if (!activeList) return;
        const nextItems = (activeList.items ?? []).map((it) =>
            String(it.id) === String(itemId) ? { ...it, done: nextDone } : it
        );
        setLists((prev) => prev.map((l) => (idEq(l.id, activeList.id) ? { ...l, items: nextItems } : l)));
        scheduleSaveList(activeList.id, { items: nextItems } as any);
    };

    const changeItemText = (itemId: ListItemId, nextText: string) => {
        if (!activeList) return;
        const nextItems = (activeList.items ?? []).map((it) =>
            String(it.id) === String(itemId) ? { ...it, text: nextText } : it
        );
        setLists((prev) => prev.map((l) => (idEq(l.id, activeList.id) ? { ...l, items: nextItems } : l)));
        scheduleSaveList(activeList.id, { items: nextItems } as any);
    };

    const removeItem = (itemId: ListItemId) => {
        if (!activeList) return;

        const removed = (activeList.items ?? []).find((it) => String(it.id) === String(itemId));
        if (!removed) return;

        const nextItems = (activeList.items ?? []).filter((it) => String(it.id) !== String(itemId));
        setLists((prev) => prev.map((l) => (idEq(l.id, activeList.id) ? { ...l, items: nextItems } : l)));

        // tenta endpoint dedicado; se não existir, o patch snapshot resolve
        (async () => {
            try {
                await postJson(`/api/user/lists/${activeList.id}/remove-goals`, { itemIds: [itemId] });
            } catch {
                scheduleSaveList(activeList.id, { items: nextItems } as any);
            }
        })();

        setUndo({
            label: 'Item removido',
            payload: { kind: 'items', listId: activeList.id, items: [removed] },
        });
    };

    const enterBulkItems = () => {
        setBulkItems(true);
        setSelectedItemIds(new Set());
    };
    const exitBulkItems = () => {
        setBulkItems(false);
        setSelectedItemIds(new Set());
    };

    const toggleSelectItem = (id: ListItemId) => {
        setSelectedItemIds((prev) => {
            const next = new Set(prev);
            const k = String(id);
            if (next.has(k)) next.delete(k);
            else next.add(k);
            return next;
        });
    };

    const bulkRemoveItems = () => {
        if (!activeList) return;
        const ids = Array.from(selectedItemIds);
        if (ids.length === 0) return;

        const removed = (activeList.items ?? []).filter((it) => selectedItemIds.has(String(it.id)));
        const nextItems = (activeList.items ?? []).filter((it) => !selectedItemIds.has(String(it.id)));

        setLists((prev) => prev.map((l) => (idEq(l.id, activeList.id) ? { ...l, items: nextItems } : l)));
        exitBulkItems();

        (async () => {
            try {
                await postJson(`/api/user/lists/${activeList.id}/remove-goals`, { itemIds: ids });
            } catch {
                scheduleSaveList(activeList.id, { items: nextItems } as any);
            }
        })();

        setUndo({
            label: `Removidos ${removed.length} itens`,
            payload: { kind: 'items', listId: activeList.id, items: removed },
        });
    };

    const bulkMarkDoneItems = () => {
        if (!activeList) return;
        const ids = new Set(selectedItemIds);
        if (ids.size === 0) return;

        const nextItems = (activeList.items ?? []).map((it) =>
            ids.has(String(it.id)) ? { ...it, done: true } : it
        );
        setLists((prev) => prev.map((l) => (idEq(l.id, activeList.id) ? { ...l, items: nextItems } : l)));
        exitBulkItems();
        scheduleSaveList(activeList.id, { items: nextItems } as any);
    };

    const clearChecks = async () => {
        if (!activeList) return;
        const nextItems = (activeList.items ?? []).map((it) => ({ ...it, done: false }));
        setLists((prev) => prev.map((l) => (idEq(l.id, activeList.id) ? { ...l, items: nextItems } : l)));

        try {
            await postJson(`/api/user/lists/${activeList.id}/clear`, {});
        } catch {
            scheduleSaveList(activeList.id, { items: nextItems } as any);
        }
    };

    const removeAllItems = () => {
        if (!activeList) return;
        const removed = activeList.items ?? [];
        if (removed.length === 0) return;

        setLists((prev) => prev.map((l) => (idEq(l.id, activeList.id) ? { ...l, items: [] } : l)));
        scheduleSaveList(activeList.id, { items: [] } as any);

        setUndo({
            label: 'Lista esvaziada',
            payload: { kind: 'items', listId: activeList.id, items: removed },
        });
    };

    // Undo handler (items)
    useEffect(() => {
        // noop (mantém estabilidade)
    }, []);

    const handleUndoItems = async (payload: Extract<UndoPayload['payload'], { kind: 'items' }>) => {
        const listId = payload.listId;
        const list = lists.find((l) => idEq(l.id, listId));
        if (!list) return;

        const nextItems = [...(payload.items ?? []), ...(list.items ?? [])];
        setLists((prev) => prev.map((l) => (idEq(l.id, listId) ? { ...l, items: nextItems } : l)));

        try {
            await postJson(`/api/user/lists/${listId}/restore-goals`, { items: payload.items });
        } catch {
            scheduleSaveList(listId, { items: nextItems } as any);
        }
    };

    const onUndoToast = async () => {
        if (!undo) return;
        try {
            if (undo.payload.kind === 'goals') {
                await handleUndo();
            } else if (undo.payload.kind === 'items') {
                await handleUndoItems(undo.payload);
                setUndo(null);
            }
        } catch {
            setUndo(null);
        }
    };

    // persist appearance for active list
    useEffect(() => {
        if (!activeList) return;
        const nextJson = JSON.stringify(appearanceList);
        setLists((prev) =>
            prev.map((l) => (idEq(l.id, activeList.id) ? { ...l, appearanceJson: nextJson } : l))
        );
        scheduleSaveList(activeList.id, { appearanceJson: nextJson } as any);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appearanceList]);

    // ---------- UI ----------
    const [newItemText, setNewItemText] = useState('');

    return (
        <div className="min-h-screen">
            <Navbar />
            <StaticBackground changeInterval={18000} showGlobe={false} />

            <main className="relative z-10 mx-auto max-w-6xl px-3 pt-28 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                            {tab === 'goals' ? 'Minha Lista' : 'Minhas Listas'}
                        </h1>
                        <p className="text-white/60 mt-1">
                            {tab === 'goals'
                                ? 'Seu bucket list pessoal — agora com um modo mais “to-do app” quando você quiser.'
                                : 'Abra, personalize e poste listas com estilo (e com reset automático de checks, do jeitinho que você sempre quis).'}
                        </p>

                        {/* Tabs */}
                        <div className="mt-3 inline-flex rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-1">
                            <button
                                className={[
                                    'px-3 py-2 rounded-xl text-sm font-semibold transition',
                                    tab === 'goals' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white',
                                ].join(' ')}
                                onClick={() => setTab('goals')}
                            >
                                Bucket List
                            </button>
                            <button
                                className={[
                                    'px-3 py-2 rounded-xl text-sm font-semibold transition',
                                    tab === 'lists' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white',
                                ].join(' ')}
                                onClick={() => setTab('lists')}
                            >
                                Minhas Listas
                            </button>
                        </div>
                    </div>

                    {/* Action stack */}
                    <div className="flex flex-col items-stretch gap-2 w-full md:w-[320px]">
                        <button
                            onClick={() => setPersonalizeOpen(true)}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold transition"
                        >
                            <Sparkles size={18} />
                            Personalizar
                        </button>

                        <ExportControlsV2
                            goals={goals.map((g) => ({ id: g.id, title: g.title, local: g.local, category: g.category ?? null }))}
                            activeList={
                                activeList
                                    ? {
                                        id: activeList.id,
                                        name: activeList.name,
                                        items: activeList.items ?? [],
                                        appearanceJson: activeList.appearanceJson,
                                    }
                                    : null
                            }
                            tab={tab}
                            appearance={currentAppearance}
                            onChangeAppearance={setCurrentAppearance}
                            title={tab === 'goals' ? 'Minha Lista' : activeList?.name ?? 'Minha Lista'}
                        />

                        <button
                            onClick={() => setCreateOpen(true)}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-lg transition"
                        >
                            <ListPlus size={18} />
                            Criar nova lista
                        </button>

                        <button
                            onClick={() => setPreviewOn((v) => !v)}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 bg-black/40 hover:bg-black/50 border border-white/10 text-white/90 transition"
                        >
                            {previewOn ? <EyeOff size={18} /> : <Eye size={18} />}
                            Preview {previewOn ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </div>

                {/* Preview panel */}
                {previewOn ? (
                    <div className="mt-5 rounded-3xl border border-white/10 bg-black/35 backdrop-blur-xl p-4 overflow-x-auto">
                        <div className="text-white/70 text-sm mb-3">
                            Preview do export ({currentAppearance.format ?? 'story'} • {currentAppearance.layout ?? 'cards'} •{' '}
                            {currentAppearance.density ?? 'compact'})
                        </div>

                        <div className="flex justify-center">
                            <div className="scale-[0.38] origin-top">
                                <ExportPreview
                                    id="export-preview-live"
                                    title={tab === 'goals' ? 'Minha Lista' : activeList?.name ?? 'Minha Lista'}
                                    subtitle={tab === 'goals' ? 'Bucket list' : 'Lista pessoal'}
                                    items={previewItems}
                                    appearance={currentAppearance}
                                />
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Content */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* LEFT: main */}
                    <div className="lg:col-span-8 space-y-3">
                        {tab === 'goals' ? (
                            <>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-white/70 text-sm">
                                        {goals.length} objetivo(s)
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {!bulkGoals ? (
                                            <button
                                                onClick={enterBulkGoals}
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm"
                                            >
                                                <Plus size={16} />
                                                Selecionar em massa
                                            </button>
                                        ) : (
                                            <button
                                                onClick={exitBulkGoals}
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm"
                                            >
                                                Sair do modo massa
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {goals.map((g) => (
                                        <div key={g.id} className="relative">
                                            {bulkGoals ? (
                                                <button
                                                    className={[
                                                        'absolute -left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-xl border',
                                                        selectedGoalIds.has(g.id)
                                                            ? 'bg-purple-500/30 border-purple-300/60 text-white'
                                                            : 'bg-black/30 border-white/15 text-white/70',
                                                    ].join(' ')}
                                                    onClick={() => toggleSelectGoal(g.id)}
                                                    aria-label="Selecionar"
                                                    title="Selecionar"
                                                >
                                                    {selectedGoalIds.has(g.id) ? '✓' : ''}
                                                </button>
                                            ) : null}

                                            <MyListCard
                                                id={g.id}
                                                title={g.title}
                                                local={g.local}
                                                done={g.done}
                                                category={g.category ?? null}
                                                onRemove={async (goalId) => removeGoalFromList(goalId)}
                                                onRemoved={() => { }}
                                                onToggleDone={async (goalId, next) => toggleGoalDone(goalId, next)}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={removeAllGoals}
                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-500/15 hover:bg-red-500/20 border border-red-300/20 text-red-100 transition"
                                    >
                                        <Trash2 size={18} />
                                        Remover todos (do bucket list)
                                    </button>
                                </div>

                                <BulkActionsBar
                                    count={selectedGoalIds.size}
                                    label="objetivos"
                                    onClear={exitBulkGoals}
                                    onRemove={bulkRemoveGoals}
                                    onMarkDone={bulkMarkDoneGoals}
                                />
                            </>
                        ) : (
                            <>
                                {/* Album + editor */}
                                <ListAlbum
                                    lists={lists}
                                    activeListId={activeListId}
                                    onOpenList={(id) => openList(id)}
                                    onRenameList={(id, name) => renameList(id, name)}
                                />

                                {!activeList ? (
                                    <div className="rounded-3xl border border-white/10 bg-black/35 backdrop-blur-xl p-6 text-white/70">
                                        Clique numa lista acima para abrir. Você pode criar várias (e sim, isso é um golpe de estado contra o Google Keep).
                                    </div>
                                ) : (
                                    <div className="rounded-3xl border border-white/10 bg-black/35 backdrop-blur-xl p-4 space-y-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="text-white font-semibold">
                                                {activeList.name}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {!bulkItems ? (
                                                    <button
                                                        onClick={enterBulkItems}
                                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm"
                                                    >
                                                        <Plus size={16} />
                                                        Selecionar em massa
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={exitBulkItems}
                                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm"
                                                    >
                                                        Sair do modo massa
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Add item */}
                                        <div className="flex gap-2">
                                            <input
                                                value={newItemText}
                                                onChange={(e) => setNewItemText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        addItemToActiveList(newItemText);
                                                        setNewItemText('');
                                                    }
                                                }}
                                                className="flex-1 rounded-2xl bg-black/25 border border-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-white/20"
                                                placeholder="Adicionar um item… (Enter)"
                                            />
                                            <button
                                                onClick={() => {
                                                    addItemToActiveList(newItemText);
                                                    setNewItemText('');
                                                }}
                                                className="rounded-2xl px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold transition"
                                            >
                                                Add
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {(activeList.items ?? []).map((it) => (
                                                <UserListItemCard
                                                    key={String(it.id)}
                                                    item={it}
                                                    bulkMode={bulkItems}
                                                    selected={selectedItemIds.has(String(it.id))}
                                                    onToggleSelect={toggleSelectItem}
                                                    onToggleDone={toggleItemDone}
                                                    onChangeText={changeItemText}
                                                    onRemove={(id) => removeItem(id)}
                                                />
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                                            <button
                                                onClick={clearChecks}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white/90 transition"
                                            >
                                                Limpar checks (reset)
                                            </button>
                                            <button
                                                onClick={removeAllItems}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-500/15 hover:bg-red-500/20 border border-red-300/20 text-red-100 transition"
                                            >
                                                Remover todos itens
                                            </button>
                                        </div>

                                        <BulkActionsBar
                                            count={selectedItemIds.size}
                                            label="itens"
                                            onClear={exitBulkItems}
                                            onRemove={bulkRemoveItems}
                                            onMarkDone={bulkMarkDoneItems}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* RIGHT: help */}
                    <div className="lg:col-span-4 space-y-3">
                        <div className="rounded-3xl border border-white/10 bg-black/35 backdrop-blur-xl p-5">
                            <div className="text-white font-semibold mb-2">Dicas rápidas</div>
                            <ul className="text-sm text-white/70 space-y-2">
                                <li>• Duplo clique em um item da lista para editar.</li>
                                <li>• Use “Preview ON” pra enxergar o export antes de postar.</li>
                                <li>• “Postar” abre gaveta com PDF / PNG / JPG (com autoclose).</li>
                                <li>• Modo massa serve pra deletar/fechar ciclos sem drama.</li>
                            </ul>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-black/35 backdrop-blur-xl p-5">
                            <div className="text-white font-semibold mb-2">Reset inteligente (próximo passo)</div>
                            <div className="text-sm text-white/70">
                                Já deixei o “gancho” no backend via <code className="text-white/80">resetRuleJson</code>.
                                No próximo patch eu plugo os controles no painel e aplico reset automático por data ao abrir a lista.
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <CreateListModal
                open={createOpen}
                onOpenChange={setCreateOpen}
                onCreate={async ({ title, templateId }) => {
                    await createList(title, templateId);
                }}
            />


            <PersonalizeDrawer
                open={personalizeOpen}
                onClose={() => setPersonalizeOpen(false)}
                appearance={currentAppearance}
                onChange={setCurrentAppearance}
            />

            <UndoToast
                undo={undo}
                onUndo={onUndoToast}
                onDismiss={() => setUndo(null)}
            />
        </div>
    );
}
