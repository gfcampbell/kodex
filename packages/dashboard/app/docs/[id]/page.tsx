"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { DocEditor } from "@/components/docs/DocEditor";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, RefreshCw, Pin, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import type { KnowledgeItem, KnowledgeItemStatus } from "@kodex/shared";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DocEditorPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [item, setItem] = useState<KnowledgeItem | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const projectPath = typeof window !== "undefined"
    ? localStorage.getItem("kodex-project-path") || ""
    : "";

  useEffect(() => {
    if (!projectPath) {
      setLoading(false);
      return;
    }

    const loadDoc = async () => {
      try {
        const response = await fetch(
          `/api/docs/${id}?path=${encodeURIComponent(projectPath)}`
        );
        if (response.ok) {
          const data = await response.json();
          setItem(data.item);
        } else if (response.status === 404) {
          toast({
            title: "Not found",
            description: "Document not found",
            variant: "destructive",
          });
          router.push("/docs");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load document",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDoc();
  }, [id, projectPath, router, toast]);

  const handleChange = (updates: Partial<KnowledgeItem>) => {
    if (item) {
      setItem({ ...item, ...updates });
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    if (!item || !projectPath) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/docs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: projectPath,
          updates: {
            title: item.title,
            content: item.content,
            pages: item.pages,
            status: item.status,
            pinned: item.pinned,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setItem(data.item);
        setHasChanges(false);
        toast({
          title: "Saved",
          description: "Document saved successfully",
        });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save document",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!projectPath) return;

    setRegenerating(true);
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
        const data = await response.json();
        if (data.item) {
          setItem(data.item);
        }
        toast({
          title: "Regenerated",
          description: "Document has been regenerated",
        });
      } else {
        throw new Error("Failed to regenerate");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate document",
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handlePin = async () => {
    if (!item) return;
    handleChange({ pinned: !item.pinned });
  };

  const handleStatusChange = (status: KnowledgeItemStatus) => {
    handleChange({ status });
  };

  const handleDelete = async () => {
    if (!projectPath) return;
    
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/docs/${id}?path=${encodeURIComponent(projectPath)}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast({
          title: "Deleted",
          description: "Document has been deleted",
        });
        router.push("/docs");
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  if (!projectPath) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Edit Document" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-muted-foreground">
              No project selected
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Edit Document" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Edit Document" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-muted-foreground">
              Document not found
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title={item.title} description={`Topic: ${item.topic}`}>
        <Button variant="ghost" size="icon" onClick={() => router.push("/docs")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <Select value={item.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={handlePin}
          title={item.pinned ? "Unpin" : "Pin"}
        >
          <Pin className={`h-4 w-4 ${item.pinned ? "text-primary" : ""}`} />
        </Button>

        <Button
          variant="outline"
          onClick={handleRegenerate}
          disabled={regenerating}
        >
          {regenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Regenerate
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleDelete}
          title="Delete"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>

        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save
        </Button>
      </Header>

      <div className="flex-1 overflow-auto p-6">
        <DocEditor item={item} onChange={handleChange} />
      </div>
    </div>
  );
}
