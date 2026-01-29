"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderOutput } from "lucide-react";

interface OutputLocationProps {
  projectPath: string;
}

export function OutputLocation({ projectPath }: OutputLocationProps) {
  const outputPath = projectPath 
    ? `${projectPath}/.kodex/docs`
    : "Select a project first";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOutput className="h-5 w-5" />
          Output Location
        </CardTitle>
        <CardDescription>
          Generated documentation will be saved to the project folder
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="output-path">Documentation Output Path</Label>
          <Input
            id="output-path"
            value={outputPath}
            disabled
            className="bg-muted font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            This location is automatically set based on your project path
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
