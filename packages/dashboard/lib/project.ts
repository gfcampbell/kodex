import { promises as fs } from "fs";
import path from "path";
import yaml from "js-yaml";
import type { KodexConfig } from "@kodex/shared";

const DEFAULT_CONFIG: Partial<KodexConfig> = {
  scan: {
    include: ["src/**/*.{ts,tsx,js,jsx}"],
    exclude: ["**/*.test.*", "**/*.spec.*", "**/node_modules/**"],
    framework: "auto",
  },
  docs: {
    outputDir: ".kodex/docs",
    format: "both",
    topics: ["authentication", "navigation", "data", "settings", "errors"],
  },
  llm: {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
  },
};

/**
 * Validate that a project path exists and is a directory
 */
export async function validateProjectPath(projectPath: string): Promise<{
  valid: boolean;
  error?: string;
  hasConfig?: boolean;
}> {
  try {
    const stats = await fs.stat(projectPath);
    if (!stats.isDirectory()) {
      return { valid: false, error: "Path is not a directory" };
    }

    // Check if kodex.config.yaml exists
    const configPath = path.join(projectPath, "kodex.config.yaml");
    try {
      await fs.access(configPath);
      return { valid: true, hasConfig: true };
    } catch {
      return { valid: true, hasConfig: false };
    }
  } catch (error) {
    return { valid: false, error: "Directory does not exist" };
  }
}

/**
 * Load project configuration
 */
export async function loadProjectConfig(projectPath: string): Promise<KodexConfig | null> {
  const configPath = path.join(projectPath, "kodex.config.yaml");
  
  try {
    const content = await fs.readFile(configPath, "utf-8");
    const config = yaml.load(content) as Partial<KodexConfig>;
    
    // Merge with defaults
    return {
      name: config.name || "My Product",
      version: config.version || "1.0.0",
      scan: {
        ...DEFAULT_CONFIG.scan,
        ...config.scan,
      },
      docs: {
        ...DEFAULT_CONFIG.docs,
        ...config.docs,
      },
      llm: {
        ...DEFAULT_CONFIG.llm,
        ...config.llm,
      },
      dashboard: config.dashboard,
    } as KodexConfig;
  } catch {
    return null;
  }
}

/**
 * Save project configuration
 */
export async function saveProjectConfig(
  projectPath: string,
  config: KodexConfig
): Promise<void> {
  const configPath = path.join(projectPath, "kodex.config.yaml");
  
  // Create a clean config object for YAML output
  const yamlConfig = {
    name: config.name,
    version: config.version,
    scan: {
      include: config.scan.include,
      exclude: config.scan.exclude,
      framework: config.scan.framework,
      ...(config.scan.agentContext ? { agentContext: config.scan.agentContext } : {}),
    },
    docs: {
      outputDir: config.docs.outputDir,
      format: config.docs.format,
      topics: config.docs.topics,
    },
    llm: {
      provider: config.llm.provider,
      model: config.llm.model,
      ...(config.llm.apiKey ? { apiKey: config.llm.apiKey } : {}),
    },
    ...(config.dashboard ? { dashboard: config.dashboard } : {}),
  };

  const yamlContent = yaml.dump(yamlConfig, {
    indent: 2,
    lineWidth: 100,
    quotingType: '"',
  });

  // Ensure .kodex directory exists
  const kodexDir = path.join(projectPath, ".kodex");
  try {
    await fs.mkdir(kodexDir, { recursive: true });
  } catch {
    // Directory may already exist
  }

  await fs.writeFile(configPath, yamlContent, "utf-8");
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): KodexConfig {
  return {
    name: "My Product",
    version: "1.0.0",
    scan: DEFAULT_CONFIG.scan!,
    docs: DEFAULT_CONFIG.docs!,
    llm: DEFAULT_CONFIG.llm!,
  } as KodexConfig;
}
