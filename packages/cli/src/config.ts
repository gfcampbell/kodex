/**
 * Configuration loader
 * 
 * Loads and validates kodex.config.yaml
 */

import { cosmiconfig } from 'cosmiconfig';
import type { KodexConfig } from '@kodex/shared';

const explorer = cosmiconfig('kodex', {
  searchPlaces: [
    'kodex.config.yaml',
    'kodex.config.yml',
    'kodex.config.json',
    'kodex.config.js',
    '.kodexrc',
    '.kodexrc.yaml',
    '.kodexrc.yml',
    '.kodexrc.json',
  ],
});

const DEFAULT_CONFIG: Partial<KodexConfig> = {
  scan: {
    include: ['src/**/*.{ts,tsx,js,jsx}'],
    exclude: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'],
    framework: 'auto',
  },
  docs: {
    outputDir: '.kodex/docs',
    format: 'both',
    topics: ['authentication', 'navigation', 'data', 'settings', 'errors'],
  },
  llm: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
  },
};

/**
 * Load configuration from the project directory
 */
export async function loadConfig(cwd: string): Promise<KodexConfig> {
  const result = await explorer.search(cwd);
  
  if (!result || !result.config) {
    throw new Error('No kodex configuration found. Run: kodex init');
  }

  // Merge with defaults
  const config: KodexConfig = {
    name: result.config.name || 'My Product',
    version: result.config.version || '1.0.0',
    scan: {
      ...DEFAULT_CONFIG.scan,
      ...result.config.scan,
    },
    docs: {
      ...DEFAULT_CONFIG.docs,
      ...result.config.docs,
    },
    llm: {
      ...DEFAULT_CONFIG.llm,
      ...result.config.llm,
    },
    dashboard: result.config.dashboard,
  };

  // Validate required fields
  if (!config.llm.provider) {
    throw new Error('Configuration error: llm.provider is required');
  }

  if (!config.llm.model) {
    throw new Error('Configuration error: llm.model is required');
  }

  return config;
}

/**
 * Get the LLM API key from environment or config
 */
export function getApiKey(config: KodexConfig): string {
  // Check config first
  if (config.llm.apiKey) {
    // If it looks like an env var reference, resolve it
    if (config.llm.apiKey.startsWith('${') && config.llm.apiKey.endsWith('}')) {
      const envVar = config.llm.apiKey.slice(2, -1);
      const value = process.env[envVar];
      if (!value) {
        throw new Error(`Environment variable not set: ${envVar}`);
      }
      return value;
    }
    return config.llm.apiKey;
  }

  // Check standard env vars
  const envVars: Record<string, string> = {
    anthropic: 'ANTHROPIC_API_KEY',
    openai: 'OPENAI_API_KEY',
    google: 'GOOGLE_API_KEY',
  };

  const envVar = envVars[config.llm.provider];
  const value = process.env[envVar];
  
  if (!value) {
    throw new Error(
      `No API key found. Set ${envVar} environment variable or configure llm.apiKey`
    );
  }

  return value;
}
