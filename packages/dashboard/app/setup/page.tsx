"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { ProjectSelector } from "@/components/setup/ProjectSelector";
import { ModelConfig } from "@/components/setup/ModelConfig";
import { AgentContext } from "@/components/setup/AgentContext";
import { ExclusionPatterns } from "@/components/setup/ExclusionPatterns";
import { OutputLocation } from "@/components/setup/OutputLocation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Save, Play, Loader2 } from "lucide-react";

interface SetupConfig {
  projectPath: string;
  name: string;
  provider: string;
  model: string;
  apiKey: string;
  agentContext: string;
  excludePatterns: string[];
}

const DEFAULT_EXCLUDE_PATTERNS = [
  "**/*.test.*",
  "**/*.spec.*",
  "**/node_modules/**",
  "**/__tests__/**",
  "**/__mocks__/**",
];

export default function SetupPage() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isValid, setIsValid] = useState(false);
  
  const [config, setConfig] = useState<SetupConfig>({
    projectPath: "",
    name: "My Product",
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    apiKey: "",
    agentContext: "",
    excludePatterns: DEFAULT_EXCLUDE_PATTERNS,
  });

  // Load saved project path from localStorage
  useEffect(() => {
    const savedPath = localStorage.getItem("kodex-project-path");
    if (savedPath) {
      setConfig((prev) => ({ ...prev, projectPath: savedPath }));
      // Auto-validate and load config
      handleLoadConfig(savedPath);
    }
  }, []);

  const handleLoadConfig = async (projectPath: string) => {
    try {
      const response = await fetch(`/api/config?path=${encodeURIComponent(projectPath)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig((prev) => ({
            ...prev,
            projectPath,
            name: data.config.name || prev.name,
            provider: data.config.llm?.provider || prev.provider,
            model: data.config.llm?.model || prev.model,
            agentContext: data.config.scan?.agentContext || "",
            excludePatterns: data.config.scan?.exclude || DEFAULT_EXCLUDE_PATTERNS,
          }));
          setIsValid(true);
        }
      }
    } catch (error) {
      console.error("Failed to load config:", error);
    }
  };

  const handleValidatePath = async (path: string): Promise<{
    valid: boolean;
    hasConfig?: boolean;
    error?: string;
  }> => {
    try {
      const response = await fetch(`/api/projects?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      
      if (data.valid) {
        setIsValid(true);
        localStorage.setItem("kodex-project-path", path);
        
        // Load existing config if available
        if (data.hasConfig) {
          await handleLoadConfig(path);
        }
      } else {
        setIsValid(false);
      }
      
      return data;
    } catch (error) {
      return { valid: false, error: "Failed to validate path" };
    }
  };

  const handleSave = async () => {
    if (!config.projectPath || !isValid) {
      toast({
        title: "Error",
        description: "Please select a valid project path first",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: config.projectPath,
          config: {
            name: config.name,
            version: "1.0.0",
            scan: {
              include: ["src/**/*.{ts,tsx,js,jsx}"],
              exclude: config.excludePatterns,
              framework: "auto",
              agentContext: config.agentContext || undefined,
            },
            docs: {
              outputDir: ".kodex/docs",
              format: "both",
              topics: ["authentication", "navigation", "data", "settings", "errors"],
            },
            llm: {
              provider: config.provider,
              model: config.model,
              apiKey: config.apiKey || undefined,
            },
          },
        }),
      });

      if (response.ok) {
        toast({
          title: "Configuration saved",
          description: "Your project settings have been saved successfully",
        });
      } else {
        throw new Error("Failed to save configuration");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleScan = async () => {
    if (!config.projectPath || !isValid) {
      toast({
        title: "Error",
        description: "Please select a valid project path first",
        variant: "destructive",
      });
      return;
    }

    // Save first, then scan
    await handleSave();

    setScanning(true);
    try {
      const response = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: config.projectPath,
          action: "scan",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Scan complete",
          description: `Generated ${data.generated} docs, updated ${data.updated}, skipped ${data.skipped}`,
        });
      } else {
        throw new Error("Failed to scan codebase");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to scan codebase",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Project Setup" 
        description="Configure your Kodex documentation project"
      >
        <Button
          onClick={handleSave}
          disabled={saving || !isValid}
          variant="outline"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save
        </Button>
        <Button
          onClick={handleScan}
          disabled={scanning || !isValid}
        >
          {scanning ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Scan & Generate
        </Button>
      </Header>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <ProjectSelector
            value={config.projectPath}
            onChange={(path) => setConfig((prev) => ({ ...prev, projectPath: path }))}
            onValidate={handleValidatePath}
          />

          <ModelConfig
            provider={config.provider}
            model={config.model}
            apiKey={config.apiKey}
            onProviderChange={(provider) => {
              // Reset model when provider changes
              const defaultModels: Record<string, string> = {
                anthropic: "claude-sonnet-4-20250514",
                openai: "gpt-4o-mini",
                google: "gemini-2.0-flash",
              };
              setConfig((prev) => ({
                ...prev,
                provider,
                model: defaultModels[provider] || "",
              }));
            }}
            onModelChange={(model) => setConfig((prev) => ({ ...prev, model }))}
            onApiKeyChange={(apiKey) => setConfig((prev) => ({ ...prev, apiKey }))}
          />

          <AgentContext
            value={config.agentContext}
            onChange={(agentContext) =>
              setConfig((prev) => ({ ...prev, agentContext }))
            }
          />

          <ExclusionPatterns
            value={config.excludePatterns}
            onChange={(excludePatterns) =>
              setConfig((prev) => ({ ...prev, excludePatterns }))
            }
          />

          <OutputLocation projectPath={config.projectPath} />
        </div>
      </div>
    </div>
  );
}
