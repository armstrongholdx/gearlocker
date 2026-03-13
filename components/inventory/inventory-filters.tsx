"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useTransition } from "react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Option = {
  id: string;
  label: string;
};

type Props = {
  categories: Option[];
  locations: Option[];
  tags: Option[];
};

export function InventoryFilters({ categories, locations, tags }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    startTransition(() => {
      router.push(`/inventory?${params.toString()}`);
    });
  }

  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-white/80 p-4">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Filter rail</div>
          <div className="text-lg font-semibold">Refine what you are looking at</div>
        </div>
        <div className="text-xs text-muted-foreground">{isPending ? "Updating filters..." : "Filters update automatically."}</div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <FilterBlock label="Search">
          <Input
            defaultValue={searchParams.get("query") ?? ""}
            placeholder="Name, asset ID, serial..."
            onChange={(event) => updateParam("query", event.target.value)}
          />
        </FilterBlock>
        <FilterBlock label="Category">
          <Select defaultValue={searchParams.get("category") ?? "all"} onValueChange={(value) => updateParam("category", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterBlock>
        <FilterBlock label="Status">
          <Select defaultValue={searchParams.get("status") ?? "all"} onValueChange={(value) => updateParam("status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="in_repair">In repair</SelectItem>
              <SelectItem value="missing">Missing</SelectItem>
              <SelectItem value="stolen">Stolen</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </FilterBlock>
        <FilterBlock label="Location">
          <Select defaultValue={searchParams.get("location") ?? "all"} onValueChange={(value) => updateParam("location", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterBlock>
        <FilterBlock label="Tag">
          <Select defaultValue={searchParams.get("tag") ?? "all"} onValueChange={(value) => updateParam("tag", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  {tag.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterBlock>
        <FilterBlock label="Sort">
          <Select defaultValue={searchParams.get("sort") ?? "recent"} onValueChange={(value) => updateParam("sort", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Newest first</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="replacementValue">Replacement value</SelectItem>
            </SelectContent>
          </Select>
        </FilterBlock>
      </div>
    </div>
  );
}

function FilterBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
