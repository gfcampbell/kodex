"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Check, X, Loader2 } from "lucide-react";

interface ProjectSelectorProps {
  value: string;
  onChange: (path: string) => void;
  onValidate: (path: string) => Promise<{ valid: boolean; hasConfig?: boolean; error?: string }>;
}

export function ProjectSelector({ value, onChange, onValidate }: ProjectSelectorProps) {
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<{
    valid: boolean;
    hasConfig?: boolean;
    error?: string;
  } | null>(null);

  const handleValidate = async () => {
    if (!value.trim()) return;
    
    setValidating(true);
    try {
      const result = await onValidate(value);
      setValidation(result);
    } catch (error) {
      setValidation({ valid: false, error: "Failed to validate path" });
    } finally {
      setValidating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Project Selection
        </CardTitle>
        <CardDescription>
          Enter the path to your project folder
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="project-path">Project Path</Label>
          <div className="flex gap-2">
            <Input
              id="project-path"
              placeholder="/path/to/your/project"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setValidation(null);
              }}
              className="flex-1"
            />
            <Button 
              onClick={handleValidate} 
              variant="outline"
              disabled={validating || !value.trim()}
            >
              {validating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Validate"
              )}
            </Button>
          </div>
        </div>

        {validation && (
          <div
            className={`flex items-center gap-2 rounded-md p-3 text-sm ${
              validation.valid
                ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200"
            }`}
          >
            {validation.valid ? (
              <>
                <Check className="h-4 w-4" />
                <span>
                  Valid project path
                  {validation.hasConfig
                    ? " - Configuration found"
                    : " - No configuration found, will create new"}
                </span>
              </>
            ) : (
              <>
                <X className="h-4 w-4" />
                <span>{validation.error}</span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
