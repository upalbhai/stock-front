"use client";

import React, { useEffect, useRef, useState } from "react";

type Option = { _id?: string; id?: string; name?: string; label?: string; [k: string]: any };

type LoadOptionsResult = { data: Option[]; meta?: { pagination?: { page: number; limit: number; total: number; totalPages: number } } };

type Props = {
  value?: Option | Option[] | null;
  onChange?: (val: Option | Option[] | null) => void;
  loadOptions: (params: { page: number; limit: number; search?: string }) => Promise<LoadOptionsResult>;
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const listEndRef = useRef<HTMLDivElement | null>(null);
  const cacheRef = useRef<Record<string, { items: Option[], hasMore: boolean, page: number }>>({});

  useEffect(() => {
    if (!open && search !== "") {
      setSearch("");
      setDebouncedSearch("");
    }
  }, [open, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    const cached = cacheRef.current[debouncedSearch];
    if (cached) {
      setItems(cached.items);
      setPage(cached.page);
      setHasMore(cached.hasMore);
    } else {
      setItems([]);
      setPage(1);
      setHasMore(true);
    }
  }, [debouncedSearch, open]);

  useEffect(() => {
    let mounted = true;
    async function fetchPage() {
      const cached = cacheRef.current[debouncedSearch];
      if (cached && cached.page >= page && cached.items.length > 0) return;
      if (!hasMore) return;
      
      setLoading(true);
      try {
        const res = await loadOptions({ page, limit: pageSize, search: debouncedSearch });
        if (!mounted) return;
        const newItems = res.data.map((d: any) => ({ ...d, id: d[idKey] ?? d.id, label: d[labelKey] ?? d.name ?? d.label }));
        
        const totalPages = res.meta?.pagination?.totalPages ?? (res.data.length < pageSize ? page : page + 1);
        const more = page < totalPages;
        
        setItems((s) => {
          const finalItems = page === 1 ? newItems : [...s, ...newItems];
          cacheRef.current[debouncedSearch] = { items: finalItems, page, hasMore: more };
          return finalItems;
        });
        
        setHasMore(more);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    if (open) fetchPage();
    return () => { mounted = false; };
  }, [page, debouncedSearch, open]);

  useEffect(() => {
    const el = listEndRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore && !loading && items.length > 0) {
          setPage((p) => p + 1);
        }
      });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [listEndRef.current, hasMore, loading, items.length]);

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
      <button 
        type="button" 
        onClick={toggle} 
        className="w-full rounded-2xl border border-border bg-surface px-3.5 py-2 text-left flex items-center justify-between focus:border-primary focus:outline-none transition text-foreground"
      >
        <div className="flex-1 min-w-0">
          {multi ? (
            <div className="flex flex-wrap gap-1.5">
              {Array.isArray(value) && (value as Option[]).length ? (value as Option[]).map((v) => (
                <span key={v.id ?? v._id} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-lg font-medium">{v[labelKey] ?? v.label}</span>
              )) : <span className="text-muted-foreground text-sm">{placeholder}</span>}
            </div>
          ) : (
            <span className="text-sm font-medium">
              {(value && ((value as any)[labelKey] ?? (value as any).label)) ?? <span className="text-muted-foreground">{placeholder}</span>}
            </span>
          )}
        </div>
        <svg className="h-4 w-4 text-muted-foreground ml-2 shrink-0 transition" viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-popover border border-border text-popover-foreground rounded-2xl shadow-soft max-h-72 overflow-auto p-1.5">
          {searchable && (
            <div className="p-1">
              <input 
                autoFocus 
                value={search} 
                onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
                placeholder="Search..." 
                className="w-full bg-surface border border-border rounded-xl px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary outline-none transition" 
              />
            </div>
          )}

          <ul className="space-y-0.5 mt-1">
            {items.map((opt) => (
              <li 
                key={opt.id ?? opt._id} 
                onClick={() => handleSelect(opt)} 
                className={`px-3 py-2 text-sm rounded-xl cursor-pointer hover:bg-muted/50 flex justify-between items-center transition ${isSelected(opt) ? "bg-muted/80 font-semibold text-primary" : "text-foreground"}`}
              >
                <span className="truncate">{opt[labelKey] ?? opt.label}</span>
                {isSelected(opt) && <span className="text-xs text-primary font-bold">✓</span>}
              </li>
            ))}
          </ul>

          {creatable && search && !items.some(i => (i[labelKey] ?? i.label).toLowerCase() === search.toLowerCase()) && (
            <div className="border-t border-border mt-1.5 p-1">
              <button 
                onClick={() => handleCreateLabel(search)} 
                className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 text-sm font-semibold transition"
              >
                Create "{search}"
              </button>
            </div>
          )}

          <div ref={listEndRef} className="h-2" />
          {loading && <div className="p-2 text-center text-xs text-muted-foreground animate-pulse">Loading...</div>}
          {!loading && items.length === 0 && <div className="p-2 text-center text-xs text-muted-foreground">No results</div>}
        </div>
      )}
    </div>
  );
}
