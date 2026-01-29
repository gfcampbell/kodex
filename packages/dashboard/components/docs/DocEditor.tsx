"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { KnowledgeItem } from "@kodex/shared";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

// Dynamically import the markdown editor to avoid SSR issues
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor"),
  { ssr: false }
);

interface DocEditorProps {
  item: KnowledgeItem;
  onChange: (updates: Partial<KnowledgeItem>) => void;
}

const statusVariants: Record<string, "default" | "secondary" | "success" | "warning"> = {
  draft: "warning",
  reviewed: "secondary",
  approved: "success",
  pinned: "default",
};

export function DocEditor({ item, onChange }: DocEditorProps) {
  const [activeTab, setActiveTab] = useState("edit");

  const handleContentChange = (value?: string) => {
    onChange({ content: value || "" });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ title: e.target.value });
  };

  const handlePagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pages = e.target.value
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    onChange({ pages });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* Main Editor */}
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="mt-4">
            <div data-color-mode="light" className="min-h-[500px]">
              <MDEditor
                value={item.content}
                onChange={handleContentChange}
                height={500}
                preview="edit"
              />
            </div>
          </TabsContent>
          <TabsContent value="preview" className="mt-4">
            <div data-color-mode="light" className="min-h-[500px] rounded-md border p-4">
              <pre className="text-sm whitespace-pre-wrap">{item.content}</pre>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sidebar - Metadata */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={item.title}
                onChange={handleTitleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pages">Pages (comma-separated)</Label>
              <Input
                id="pages"
                value={item.pages.join(", ")}
                onChange={handlePagesChange}
                placeholder="/page1, /page2"
              />
            </div>

            <div className="space-y-2">
              <Label>Topic</Label>
              <div className="text-sm text-muted-foreground">{item.topic}</div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div>
                <Badge variant={statusVariants[item.status]}>
                  {item.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Confidence</span>
              <span>{Math.round(item.confidence * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Human Edited</span>
              <span>{item.humanEdited ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pinned</span>
              <span>{item.pinned ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Generated</span>
              <span>
                {new Date(item.generatedAt).toLocaleDateString()}
              </span>
            </div>
            {item.lastEditedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Edited</span>
                <span>
                  {new Date(item.lastEditedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Source Files</CardTitle>
          </CardHeader>
          <CardContent>
            {item.sourceFiles.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {item.sourceFiles.map((file) => (
                  <li key={file} className="truncate text-muted-foreground">
                    <code className="text-xs">{file}</code>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No source files</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
