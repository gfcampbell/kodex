/**
 * Kodex Shared Types
 * 
 * Core types used across CLI and Dashboard packages.
 */

// =============================================================================
// Code Scanner Types
// =============================================================================

/**
 * A route/page discovered in the codebase
 */
export interface Route {
  /** URL path (e.g., "/settings/security") */
  path: string;
  /** Source file where this route is defined */
  sourceFile: string;
  /** Component that renders this route */
  component?: string;
  /** Line number in source file */
  line?: number;
  /** Dynamic segments (e.g., [id], :userId) */
  params?: string[];
}

/**
 * A React component discovered in the codebase
 */
export interface Component {
  /** Component name */
  name: string;
  /** Source file path */
  sourceFile: string;
  /** Line number where component is defined */
  line: number;
  /** Exported (true) or internal (false) */
  exported: boolean;
  /** Props interface name if detected */
  propsType?: string;
  /** Child components used */
  children?: string[];
}

/**
 * A page (route + components + strings)
 */
export interface Page {
  /** URL path */
  path: string;
  /** Components that render on this page */
  components: string[];
  /** Source files involved */
  sourceFiles: string[];
  /** User-visible strings on this page */
  strings: ExtractedString[];
  /** Features detected on this page */
  features: string[];
}

/**
 * A user-facing string extracted from code
 */
export interface ExtractedString {
  /** The string content */
  value: string;
  /** Where it was found */
  sourceFile: string;
  /** Line number */
  line: number;
  /** Type of string (heading, label, button, error, etc.) */
  type: 'heading' | 'label' | 'button' | 'error' | 'placeholder' | 'other';
  /** Associated component */
  component?: string;
}

/**
 * An API endpoint discovered in the codebase
 */
export interface ApiEndpoint {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** URL path */
  path: string;
  /** Source file */
  sourceFile: string;
  /** Handler function name */
  handler?: string;
}

/**
 * A detected feature pattern
 */
export interface DetectedFeature {
  /** Feature identifier (e.g., "authentication.password-reset") */
  id: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Evidence that triggered detection */
  evidence: {
    pattern: string;
    sourceFile: string;
    line: number;
  }[];
}

/**
 * Complete code analysis result
 */
export interface CodeMap {
  /** Discovered routes */
  routes: Route[];
  /** Discovered components */
  components: Component[];
  /** Pages (routes with associated data) */
  pages: Page[];
  /** Extracted strings */
  strings: ExtractedString[];
  /** API endpoints */
  apiEndpoints: ApiEndpoint[];
  /** Detected features */
  features: DetectedFeature[];
  /** Scan metadata */
  meta: {
    scannedAt: string;
    filesScanned: number;
    scanDurationMs: number;
    framework?: string;
  };
}

// =============================================================================
// Knowledge Base Types
// =============================================================================

/**
 * Status of a knowledge item
 */
export type KnowledgeItemStatus = 'draft' | 'reviewed' | 'approved' | 'pinned';

/**
 * A single knowledge base item (help document)
 */
export interface KnowledgeItem {
  /** Unique identifier */
  id: string;
  /** Topic category (e.g., "authentication.password-reset") */
  topic: string;
  /** Document title */
  title: string;
  /** Pages where this doc applies */
  pages: string[];
  /** Markdown content */
  content: string;
  /** Source files this was generated from */
  sourceFiles: string[];
  /** Git commit hash when generated */
  codeVersion: string;
  /** When this was generated */
  generatedAt: string;
  /** Current status */
  status: KnowledgeItemStatus;
  /** LLM confidence in the generation (0-1) */
  confidence: number;
  /** Whether a human has edited this */
  humanEdited: boolean;
  /** Prevent auto-regeneration */
  pinned: boolean;
  /** Last human edit timestamp */
  lastEditedAt?: string;
  /** Who last edited */
  lastEditedBy?: string;
}

/**
 * Status of a gap item
 */
export type GapStatus = 'pending' | 'in-progress' | 'resolved' | 'wont-fix';

/**
 * An unanswered question (gap in knowledge base)
 */
export interface GapItem {
  /** Unique identifier */
  id: string;
  /** The question that wasn't answered */
  question: string;
  /** Page where the question was asked */
  page?: string;
  /** When first asked */
  askedAt: string;
  /** How many times this has been asked */
  frequency: number;
  /** Current status */
  status: GapStatus;
  /** Assigned team member */
  assignee?: string;
  /** Knowledge item created to resolve this */
  resolvedBy?: string;
  /** Resolution notes */
  resolution?: string;
  /** Auto-detected topic category */
  suggestedTopic?: string;
}

/**
 * The complete knowledge base
 */
export interface KnowledgeBase {
  /** All knowledge items */
  items: KnowledgeItem[];
  /** Unanswered questions */
  gaps: GapItem[];
  /** Cached code analysis */
  codeMap?: CodeMap;
  /** Knowledge base metadata */
  meta: {
    name: string;
    version: string;
    lastScanAt?: string;
    lastGenerateAt?: string;
  };
}

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * LLM provider configuration
 */
export interface LLMConfig {
  /** Provider name */
  provider: 'anthropic' | 'openai' | 'google';
  /** Model identifier */
  model: string;
  /** API key (or env var name) */
  apiKey?: string;
  /** Max tokens for generation */
  maxTokens?: number;
  /** Temperature */
  temperature?: number;
}

/**
 * Scan configuration
 */
export interface ScanConfig {
  /** Glob patterns to include */
  include: string[];
  /** Glob patterns to exclude */
  exclude: string[];
  /** Framework hint (auto-detected if not specified) */
  framework?: 'react' | 'nextjs' | 'express' | 'auto';
}

/**
 * Documentation generation configuration
 */
export interface DocsConfig {
  /** Output directory (relative to project root) */
  outputDir: string;
  /** Output format */
  format: 'markdown' | 'json' | 'both';
  /** Topics to generate */
  topics: string[];
  /** Custom topics */
  customTopics?: CustomTopic[];
}

/**
 * Custom topic definition
 */
export interface CustomTopic {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Detection patterns */
  patterns: string[];
  /** Custom prompt for generation */
  prompt: string;
}

/**
 * Dashboard configuration
 */
export interface DashboardConfig {
  /** Port to run on */
  port: number;
  /** Enable authentication */
  auth: boolean;
}

/**
 * Complete Kodex configuration
 */
export interface KodexConfig {
  /** Project name */
  name: string;
  /** Project version */
  version: string;
  /** Scan settings */
  scan: ScanConfig;
  /** Doc generation settings */
  docs: DocsConfig;
  /** LLM settings */
  llm: LLMConfig;
  /** Dashboard settings */
  dashboard?: DashboardConfig;
}

// =============================================================================
// Event Types (for analytics/logging)
// =============================================================================

export interface ScanEvent {
  type: 'scan';
  timestamp: string;
  filesScanned: number;
  routesFound: number;
  componentsFound: number;
  featuresDetected: number;
  durationMs: number;
}

export interface GenerateEvent {
  type: 'generate';
  timestamp: string;
  itemsGenerated: number;
  itemsUpdated: number;
  itemsSkipped: number;
  tokensUsed: number;
  durationMs: number;
}

export interface GapEvent {
  type: 'gap';
  timestamp: string;
  question: string;
  page?: string;
  matched: boolean;
}

export type KodexEvent = ScanEvent | GenerateEvent | GapEvent;
