"use client";

import { DocCard } from "./DocCard";
import type { KnowledgeItem } from "@kodex/shared";

interface DocsListProps {
  items: KnowledgeItem[];
  onPin?: (id: string, pinned: boolean) => void;
  onRegenerate?: (id: string) => void;
}

export function DocsList({ items, onPin, onRegenerate }: DocsListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          No documentation found
        </p>
        <p className="text-sm text-muted-foreground">
          Run a scan to generate documentation from your codebase
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <DocCard
          key={item.id}
          item={item}
          onPin={onPin}
          onRegenerate={onRegenerate}
        />
      ))}
    </div>
  );
}
