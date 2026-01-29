"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EyeOff } from "lucide-react";

interface ExclusionPatternsProps {
  value: string[];
  onChange: (patterns: string[]) => void;
}

export function ExclusionPatterns({ value, onChange }: ExclusionPatternsProps) {
  const textValue = value.join("\n");

  const handleChange = (text: string) => {
    const patterns = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    onChange(patterns);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EyeOff className="h-5 w-5" />
          Exclusion Patterns
        </CardTitle>
        <CardDescription>
          Specify areas of the codebase to skip during analysis (one pattern per line)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="exclusion-patterns">Glob Patterns</Label>
          <Textarea
            id="exclusion-patterns"
            placeholder={`**/node_modules/**
**/*.test.*
**/*.spec.*
**/legacy/**
**/migrations/**`}
            value={textValue}
            onChange={(e) => handleChange(e.target.value)}
            className="min-h-[150px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Use glob patterns to exclude files and directories. Common patterns include
            test files, legacy code, and generated files.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
