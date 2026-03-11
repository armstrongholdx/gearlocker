"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
};

export function InventoryFilters({ categories, locations }: Props) {
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
    <div className="grid gap-3 rounded-2xl border bg-white/80 p-4 md:grid-cols-4">
      <Input
        defaultValue={searchParams.get("query") ?? ""}
        placeholder="Search name, asset ID, serial, brand..."
        onChange={(event) => updateParam("query", event.target.value)}
      />
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
      <Select defaultValue={searchParams.get("status") ?? "all"} onValueChange={(value) => updateParam("status", value)}>
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="checked_out">Checked out</SelectItem>
          <SelectItem value="in_repair">In repair</SelectItem>
          <SelectItem value="missing">Missing</SelectItem>
          <SelectItem value="stolen">Stolen</SelectItem>
          <SelectItem value="sold">Sold</SelectItem>
          <SelectItem value="retired">Retired</SelectItem>
        </SelectContent>
      </Select>
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
      <div className="text-xs text-muted-foreground">{isPending ? "Updating filters..." : "Filters update automatically."}</div>
    </div>
  );
}
