"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { DocsList } from "@/components/docs/DocsList";
import { DocsFilters } from "@/components/docs/DocsFilters";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCw, Loader2 } from "lucide-react";
import type { KnowledgeItem } from "@kodex/shared";

export default function DocsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [topic, setTopic] = useState("all");
  
  // Get unique topics from items
  const topics = [...new Set(items.map((item) => item.topic.split(".")[0]))];

  const projectPath = typeof window !== "undefined" 
    ? localStorage.getItem("kodex-project-path") || ""
    : "";

  const loadDocs = useCallback(async () => {
    if (!projectPath) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ path: projectPath });
      if (status !== "all") params.set("status", status);
      if (topic !== "all") params.set("topic", topic);
      if (search) params.set("search", search);

      const response = await fetch(`/api/docs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Failed to load docs:", error);
      toast({
        title: "Error",
        description: "Failed to load documentation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [projectPath, status, topic, search, toast]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const handlePin = async (id: string, pinned: boolean) => {
    try {
      const response = await fetch(`/api/docs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: projectPath,
          updates: { pinned },
        }),
      });

      if (response.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, pinned } : item
          )
        );
        toast({
          title: pinned ? "Document pinned" : "Document unpinned",
          description: pinned
            ? "This document will not be auto-regenerated"
            : "This document will be auto-regenerated on scan",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update document",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = async (id: string) => {
    try {
      const response = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: projectPath,
          itemId: id,
        }),
      });

      if (response.ok) {
        toast({
          title: "Regeneration queued",
          description: "The document will be regenerated",
        });
        loadDocs();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate document",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateAll = async () => {
    if (!projectPath) return;

    setRegenerating(true);
    try {
      const response = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: projectPath,
          action: "scan",
        }),
      });

      if (response.ok) {
        toast({
          title: "Scan complete",
          description: "Documentation has been regenerated",
        });
        loadDocs();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate documentation",
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  if (!projectPath) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Documentation" description="View and manage generated docs" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-muted-foreground">
              No project selected
            </p>
            <p className="text-sm text-muted-foreground">
              Go to Setup to select a project first
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Documentation" 
        description={`${total} documents in knowledge base`}
      >
        <Button
          onClick={handleRegenerateAll}
          disabled={regenerating}
          variant="outline"
        >
          {regenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Regenerate All
        </Button>
      </Header>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <DocsFilters
            search={search}
            status={status}
            topic={topic}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
            onTopicChange={setTopic}
            topics={topics}
          />

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DocsList
              items={items}
              onPin={handlePin}
              onRegenerate={handleRegenerate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
