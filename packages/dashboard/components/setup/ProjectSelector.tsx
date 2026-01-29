"use client";

import { useState, useRef } from "react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Get the path from the first file's webkitRelativePath
      const relativePath = files[0].webkitRelativePath;
      const folderName = relativePath.split("/")[0];
      
      // Since browser doesn't give us full path, show the folder name
      // and inform user to enter full path
      onChange(folderName);
      setValidation({
        valid: false,
        error: `Selected folder: "${folderName}". Please enter the full absolute path to this folder.`,
      });
    }
    // Reset input so same folder can be selected again
    e.target.value = "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Project Selection
        </CardTitle>
        <CardDescription>
          Enter the path to your project folder or use Browse to select it
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
            <input
              ref={fileInputRef}
              type="file"
              /* @ts-expect-error webkitdirectory is a non-standard attribute */
              webkitdirectory=""
              directory=""
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              onClick={handleBrowse}
              variant="outline"
              type="button"
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Browse
            </Button>
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
