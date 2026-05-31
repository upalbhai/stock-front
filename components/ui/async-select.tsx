"use client";

import React, { useEffect, useRef, useState } from "react";

type Option = { _id?: string; id?: string; name?: string; label?: string; [k: string]: any };

type LoadOptionsResult = { data: Option[]; meta?: { pagination?: { page: number; limit: number; total: number; totalPages: number } } };

type Props = {
  value?: Option | Option[] | null;
  onChange?: (val: Option | Option[] | null) => void;
  loadOptions: (params: { page: number; limit: number; q?: string }) => Promise<LoadOptionsResult>;
  multi?: boolean;
  searchable?: boolean;
  pageSize?: number;
  placeholder?: string;
  creatable?: boolean;
  className?: string;
  idKey?: string;
  labelKey?: string;
};

export default function AsyncSelect({ value, onChange, loadOptions, multi = false, searchable = true, pageSize = 50, placeholder = "Select...", creatable = false, className = "", idKey = "_id", labelKey = "name" }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Option[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const listEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setItems([]);
    setPage(1);
    setHasMore(true);
  }, [open, q]);

  useEffect(() => {
    let mounted = true;
    async function fetchPage() {
      if (!hasMore || loading) return;
      setLoading(true);
      try {
        const res = await loadOptions({ page, limit: pageSize, q });
        if (!mounted) return;
        const newItems = res.data.map((d: any) => ({ ...d, id: d[idKey] ?? d.id, label: d[labelKey] ?? d.name ?? d.label }));
        setItems((s) => (page === 1 ? newItems : [...s, ...newItems]));
        const total = res.meta?.pagination?.total ?? newItems.length;
        const totalPages = res.meta?.pagination?.totalPages ?? (res.data.length < pageSize ? page : page + 1);
        setHasMore(page < totalPages);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    if (open) fetchPage();
    return () => { mounted = false; };
  }, [page, q, open]);

  useEffect(() => {
    const el = listEndRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore && !loading) {
          setPage((p) => p + 1);
        }
      });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [listEndRef.current, hasMore, loading]);

  const toggle = () => setOpen((o) => !o);

  const isSelected = (opt: Option) => {
    if (multi) {
      return Array.isArray(value) && (value as Option[]).some((v) => (v.id ?? v._id) === (opt.id ?? opt._id));
    }
    return (value && ((value as any).id ?? (value as any)._id) === (opt.id ?? opt._id)) ?? false;
  };

  function handleSelect(opt: Option) {
    if (multi) {
      const arr = Array.isArray(value) ? [...(value as Option[])] : [];
      const exists = arr.findIndex((a) => (a.id ?? a._id) === (opt.id ?? opt._id));
      if (exists >= 0) arr.splice(exists, 1); else arr.push(opt);
      onChange?.(arr);
    } else {
      onChange?.(opt);
      setOpen(false);
    }
  }

  async function handleCreateLabel(label: string) {
    if (!creatable) return;
    const newOpt: Option = { id: `new_${Date.now()}`, label, name: label };
    setItems((s) => [newOpt, ...s]);
    if (multi) {
      const arr = Array.isArray(value) ? [...(value as Option[])] : [];
      arr.push(newOpt);
      onChange?.(arr);
    } else {
      onChange?.(newOpt);
      setOpen(false);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button type="button" onClick={toggle} className="w-full rounded-2xl border px-3 py-2 text-left flex items-center justify-between">
        <div className="flex-1">
          {multi ? (
            <div className="flex flex-wrap gap-1">
              {Array.isArray(value) && (value as Option[]).length ? (value as Option[]).map((v) => (
                <span key={v.id ?? v._id} className="text-sm bg-gray-100 px-2 py-1 rounded">{v[labelKey] ?? v.label}</span>
              )) : <span className="text-gray-500">{placeholder}</span>}
            </div>
          ) : (
            <span className="text-gray-700">{(value && ((value as any)[labelKey] ?? (value as any).label)) ?? <span className="text-gray-500">{placeholder}</span>}</span>
          )}
        </div>
        <svg className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded shadow max-h-72 overflow-auto">
          {searchable && (
            <div className="p-2">
              <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search..." className="w-full border rounded px-2 py-1" />
            </div>
          )}

          <ul>
            {items.map((opt) => (
              <li key={opt.id ?? opt._id} onClick={() => handleSelect(opt)} className={`px-3 py-2 cursor-pointer hover:bg-gray-50 flex justify-between ${isSelected(opt) ? "bg-gray-100" : ""}`}>
                <span>{opt[labelKey] ?? opt.label}</span>
                {isSelected(opt) && <span className="text-sm text-gray-500">✓</span>}
              </li>
            ))}
          </ul>

          {creatable && q && !items.some(i => (i[labelKey] ?? i.label).toLowerCase() === q.toLowerCase()) && (
            <div className="border-t p-2">
              <button onClick={() => handleCreateLabel(q)} className="w-full rounded bg-indigo-600 text-white px-2 py-1">Create "{q}"</button>
            </div>
          )}

          <div ref={listEndRef} className="h-2" />
          {loading && <div className="p-2 text-center text-sm text-gray-500">Loading...</div>}
          {!loading && items.length === 0 && <div className="p-2 text-center text-sm text-gray-500">No results</div>}
        </div>
      )}
    </div>
  );
}
