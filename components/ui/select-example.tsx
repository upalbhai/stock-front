"use client";

import React, { useState } from "react";
import AsyncSelect from "./async-select";

async function loadCategories({ page, limit, q }: { page: number; limit: number; q?: string }) {
  const params = new URLSearchParams();
  params.set("flat", "true");
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (q) params.set("q", q);
  const res = await fetch(`/api/categories?${params.toString()}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json();
}

export default function CategorySelectExample() {
  const [val, setVal] = useState<any>(null);
  return (
    <div className="w-80">
      <AsyncSelect
        value={val}
        onChange={setVal}
        loadOptions={loadCategories}
        placeholder="All Categories"
        searchable
        pageSize={25}
        creatable
      />
    </div>
  );
}
