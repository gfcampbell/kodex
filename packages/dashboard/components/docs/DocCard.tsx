"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Pin, Edit, RefreshCw, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { KnowledgeItem } from "@kodex/shared";

interface DocCardProps {
  item: KnowledgeItem;
  onPin?: (id: string, pinned: boolean) => void;
  onRegenerate?: (id: string) => void;
}

const statusVariants: Record<string, "default" | "secondary" | "success" | "warning"> = {
  draft: "warning",
  reviewed: "secondary",
  approved: "success",
  pinned: "default",
};

export function DocCard({ item, onPin, onRegenerate }: DocCardProps) {
  const formattedDate = new Date(item.generatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const topicCategory = item.topic.split(".")[0];
  const confidencePercent = Math.round(item.confidence * 100);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg">
              <Link
                href={`/docs/${item.id}`}
                className="hover:underline"
              >
                {item.title}
              </Link>
            </CardTitle>
            {item.pinned && (
              <Pin className="h-4 w-4 text-primary" />
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/docs/${item.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRegenerate?.(item.id)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPin?.(item.id, !item.pinned)}>
                <Pin className="mr-2 h-4 w-4" />
                {item.pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant={statusVariants[item.status] || "secondary"}>
            {item.status}
          </Badge>
          <Badge variant="outline">{topicCategory}</Badge>
          {item.humanEdited && (
            <Badge variant="secondary">Edited</Badge>
          )}
          <span className="text-muted-foreground">
            {confidencePercent}% confidence
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{formattedDate}</span>
        </div>
        
        {item.pages.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.pages.slice(0, 3).map((page) => (
              <code
                key={page}
                className="rounded bg-muted px-1.5 py-0.5 text-xs"
              >
                {page}
              </code>
            ))}
            {item.pages.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{item.pages.length - 3} more
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
