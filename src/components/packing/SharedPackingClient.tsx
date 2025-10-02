import React, { useEffect, useState, useCallback, useMemo } from 'react';

import type { PackingItem } from '@/types';

import { useDictionary } from '@/components/hooks/useDictionary';
import PackingListItem from '@/components/PackingListItem';
import { CATEGORY_ICONS } from '@/lib/constants';

interface ShareLinkMeta {
  token: string;
  can_modify: boolean;
  expires_at?: string | null;
}
interface ListRow {
  id: string;
  trip_id: string;
  categories: string[];
  list_meta: unknown;
}

// SharedPackingClient uses global dictionary keys; fallbacks to Polish exist in main app

interface CategoryGroupMeta {
  packed: number;
  total: number;
  items: PackingItem[];
}
const noop = () => {
  /* no-op */
};

const SharedPackingClient: React.FC<{ token?: string }> = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<ShareLinkMeta | null>(null);
  const [list, setList] = useState<ListRow | null>(null);
  const [items, setItems] = useState<PackingItem[]>([]);
  // Checklist intentionally omitted in shared simplified view for now (could be added similarly)
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newCategory, setNewCategory] = useState('Inne');
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isCategorizedView, setIsCategorizedView] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'az' | 'za' | 'count'>('az');

  const dict = useDictionary();
  const sharedT = dict.packingAssistant?.share; // existing share modal dictionary subset
  const listT = dict.packing?.list;
  const ui = dict.ui?.common;

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/packing/share/${token}/list`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Fetch failed');
      }
      const data = await res.json();
      setLink(data.link);
      setList(data.list);
      setItems(
        (data.items || []).map(
          (it: {
            id: number;
            name: string;
            qty: string;
            category?: string;
            notes?: string | null;
            optional?: boolean;
            packed: boolean;
          }) => ({
            id: it.id,
            name: it.name,
            qty: it.qty,
            category: it.category || 'Inne',
            notes: it.notes || undefined,
            optional: it.optional || false,
            packed: it.packed,
          })
        )
      );
      // checklist intentionally ignored in shared simplified view
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const canModify = !!link?.can_modify && !(link?.expires_at && new Date(link.expires_at).getTime() < Date.now());

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify) return;
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/packing/share/${token}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          qty: newQty.trim() || '1',
          category: newCategory.trim() || 'Inne',
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Add failed');
      }
      setNewName('');
      setNewQty('1');
      fetchAll();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const optimisticUpdate = (id: number, partial: Partial<PackingItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...partial } : it)));
  };

  const handleToggle = async (id: number) => {
    if (!canModify) return;
    const target = items.find((i) => i.id === id);
    if (!target) return;
    const newPacked = !target.packed;
    optimisticUpdate(id, { packed: newPacked });
    setUpdatingIds((s) => new Set(s).add(id));
    try {
      const res = await fetch(`/api/packing/share/${token}/items?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packed: newPacked }),
      });
      if (!res.ok) throw new Error('Toggle failed');
    } catch (e) {
      optimisticUpdate(id, { packed: target.packed });
      setError((e as Error).message);
    } finally {
      setUpdatingIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

  const handleInlineUpdate = async (id: number, newName: string, newQty: string) => {
    if (!canModify) return;
    optimisticUpdate(id, { name: newName, qty: newQty });
    setUpdatingIds((s) => new Set(s).add(id));
    try {
      const res = await fetch(`/api/packing/share/${token}/items?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, qty: newQty }),
      });
      if (!res.ok) throw new Error('Update failed');
    } catch (e) {
      setError((e as Error).message);
      fetchAll();
    } finally {
      setUpdatingIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

  // Polling sync every 5s (skips if tab hidden)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) fetchAll();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const expiresInfo = link?.expires_at ? new Date(link.expires_at) : null;
  const expired = expiresInfo ? Date.now() > expiresInfo.getTime() : false;

  // Derived / filtered
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const q = searchTerm.toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
  }, [items, searchTerm]);

  const baseCategories = useMemo(() => {
    const set = new Set<string>();
    filteredItems.forEach((i) => set.add(i.category || 'Inne'));
    return Array.from(set.values());
  }, [filteredItems]);

  const categories = useMemo(() => {
    const withCounts = baseCategories.map((c) => ({
      name: c,
      count: filteredItems.filter((i) => (i.category || 'Inne') === c).length,
    }));
    if (sortBy === 'az') return withCounts.sort((a, b) => a.name.localeCompare(b.name)).map((x) => x.name);
    if (sortBy === 'za') return withCounts.sort((a, b) => b.name.localeCompare(a.name)).map((x) => x.name);
    // count
    return withCounts.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).map((x) => x.name);
  }, [baseCategories, filteredItems, sortBy]);

  const grouped = useMemo(() => {
    return filteredItems.reduce<Record<string, CategoryGroupMeta>>((acc, it) => {
      const ctg = it.category || 'Inne';
      if (!acc[ctg]) acc[ctg] = { packed: 0, total: 0, items: [] };
      acc[ctg].total += 1;
      if (it.packed) acc[ctg].packed += 1;
      acc[ctg].items.push(it);
      return acc;
    }, {});
  }, [filteredItems]);

  const overall = useMemo(() => {
    if (items.length === 0) return { packed: 0, total: 0, pct: 0 };
    const packed = items.filter((i) => i.packed).length;
    return { packed, total: items.length, pct: (packed / items.length) * 100 };
  }, [items]);

  const areAllExpanded = useMemo(() => {
    if (categories.length === 0) return false;
    return categories.every((c) => expandedCategories.has(c));
  }, [categories, expandedCategories]);

  const toggleCategory = (c: string) => {
    setExpandedCategories((prev) => {
      const n = new Set(prev);
      if (n.has(c)) n.delete(c);
      else n.add(c);
      return n;
    });
  };
  const toggleAll = () => {
    if (areAllExpanded) setExpandedCategories(new Set());
    else setExpandedCategories(new Set(categories));
  };

  const AddForm =
    canModify && !expired ? (
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 mt-3 no-print">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={listT?.addItemPlaceholder || 'Add item...'}
          className="flex-grow px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200"
          required
        />
        <input
          type="text"
          value={newQty}
          onChange={(e) => setNewQty(e.target.value)}
          placeholder={listT?.quantity || 'Qty'}
          className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200"
        />
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Category"
          className="w-40 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200"
        />
        <button
          type="submit"
          disabled={adding}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
        >
          {adding ? '...' : '+'}
        </button>
      </form>
    ) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 transition-colors">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="mb-6 p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700">
          <h1 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-3">
            <span>{sharedT?.title || '🧳 Shared Packing'}</span>
            {link && (
              <span
                className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  canModify ? 'bg-green-600 text-white' : 'bg-slate-400 text-white'
                }`}
              >
                {canModify ? sharedT?.collaborateBadge || 'Collaborate' : sharedT?.viewOnlyBadge || 'View only'}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            {sharedT?.title || 'Shared packing list'} • {canModify ? sharedT?.allowEdits : sharedT?.viewOnlyBadge}
          </p>
          {expiresInfo && (
            <p className="text-xs mt-2 text-slate-500 dark:text-slate-500">
              {(sharedT?.expiryLabel || 'Expiry') + ': ' + expiresInfo.toLocaleString()}
            </p>
          )}
          {expired && <p className="text-xs text-red-600 mt-1">{'Expired'}</p>}
        </div>
        {error && (
          <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm flex justify-between items-center">
            <span>{'Error: ' + error}</span>
            <button onClick={() => setError(null)} className="text-xs underline">
              {ui?.close || 'Hide'}
            </button>
          </div>
        )}
        {loading ? (
          <div className="p-8 text-center text-slate-500">{ui?.loading || 'Loading...'}</div>
        ) : !list ? (
          <div className="p-8 text-center text-slate-500">{'List not found'}</div>
        ) : (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b dark:border-slate-700">
              <div className="flex items-center gap-4 flex-wrap">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {listT?.heading || 'Lista do spakowania'}
                </h2>
                {overall.total > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {overall.packed}/{overall.total}
                    </span>
                    <div className="w-28 bg-slate-200 dark:bg-slate-700 rounded-full h-2 relative overflow-hidden">
                      <div
                        className="h-2 bg-green-500 rounded-full transition-all"
                        style={{ width: `${overall.pct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={listT?.searchPlaceholder || 'Szukaj przedmiotów...'}
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-300 rounded-full text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-slate-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={() => setIsCategorizedView((p) => !p)}
                  className="flex-shrink-0 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isCategorizedView ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2m14 0h-2M5 11H3"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {AddForm}

            {/* List */}
            {isCategorizedView ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <button
                    onClick={toggleAll}
                    className="px-3 py-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 disabled:opacity-50"
                    disabled={categories.length === 0}
                  >
                    {areAllExpanded ? ui?.collapse || 'Collapse all' : ui?.expand || 'Expand all'}
                  </button>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-2">
                    {listT?.sortCategories || 'Sort categories:'}
                  </span>
                  <button
                    onClick={() => setSortBy('az')}
                    className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${sortBy === 'az' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                  >
                    A-Z
                  </button>
                  <button
                    onClick={() => setSortBy('za')}
                    className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${sortBy === 'za' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                  >
                    Z-A
                  </button>
                  <button
                    onClick={() => setSortBy('count')}
                    className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${sortBy === 'count' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                  >
                    {listT?.itemsCount || '# Items'}
                  </button>
                </div>
                {categories.map((category) => {
                  const meta = grouped[category];
                  const Icon = CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
                  const isExpanded = expandedCategories.has(category);
                  const prog = meta && meta.total > 0 ? (meta.packed / meta.total) * 100 : 0;
                  return (
                    <div key={category} className="print:block">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className="w-full flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer text-left"
                      >
                        <div className="flex items-center flex-grow text-left group">
                          <Icon />
                          <div className="ml-3 flex-grow">
                            <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400">{category}</h3>
                            {meta.total > 0 && (
                              <div className="mt-1.5 pr-4">
                                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                                  <span>{ui?.progress || 'Postęp'}</span>
                                  <span>
                                    {meta.packed} / {meta.total}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 mt-1">
                                  <div
                                    className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${prog}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-6 w-6 text-slate-400 transform transition-transform duration-300 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                          isExpanded ? 'max-h-[2000px] opacity-100 visible' : 'max-h-0 opacity-0 invisible'
                        }`}
                      >
                        <div className="pt-1 pb-2 pl-2 pr-1">
                          {meta.items.length > 0 ? (
                            <ul className="space-y-1">
                              {meta.items.map((it) => (
                                <PackingListItem
                                  key={it.id}
                                  item={it}
                                  isDraggable={false}
                                  isDragged={false}
                                  onToggleItem={() => handleToggle(it.id)}
                                  onDeleteItem={noop}
                                  onUpdateItem={(id, name, qty) => handleInlineUpdate(id, name, qty)}
                                  onDragStart={noop}
                                  onDragEnd={noop}
                                  onDrop={
                                    noop as unknown as (e: React.DragEvent<HTMLLIElement>, item: PackingItem) => void
                                  }
                                  onDragOver={noop}
                                  onTouchStart={noop}
                                  onTouchMove={noop}
                                  onTouchEnd={noop}
                                  hideDeleteButton
                                  disabled={!canModify || expired || updatingIds.has(it.id)}
                                />
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-slate-400 italic px-2">
                              {listT?.noItemsInCategory || 'Brak przedmiotów w tej kategorii.'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                <ul className="space-y-1">
                  {filteredItems.map((it) => (
                    <PackingListItem
                      key={it.id}
                      item={it}
                      isDraggable={false}
                      isDragged={false}
                      onToggleItem={() => handleToggle(it.id)}
                      onDeleteItem={noop}
                      onUpdateItem={(id, name, qty) => handleInlineUpdate(id, name, qty)}
                      onDragStart={noop}
                      onDragEnd={noop}
                      onDrop={noop as unknown as (e: React.DragEvent<HTMLLIElement>, item: PackingItem) => void}
                      onDragOver={noop}
                      onTouchStart={noop}
                      onTouchMove={noop}
                      onTouchEnd={noop}
                      hideDeleteButton
                      disabled={!canModify || expired || updatingIds.has(it.id)}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <div className="mt-10 text-center text-[11px] text-slate-400">
          {sharedT?.allowEditsHelp || 'Shared mode • Limited actions • No deletions'}
        </div>
      </div>
    </div>
  );
};

export default SharedPackingClient;
