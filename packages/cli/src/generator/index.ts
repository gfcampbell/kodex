/**
 * Doc Generator
 * 
 * Generates documentation using LLMs.
 */

import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getApiKey } from '../config.js';
import type {
  CodeMap,
  KnowledgeItem,
  KnowledgeBase,
  KodexConfig,
  DetectedFeature,
  Page,
} from '@kodex/shared';

interface GenerateOptions {
  changedOnly?: boolean;
  dryRun?: boolean;
}

interface GenerateResult {
  items: KnowledgeItem[];
  generated: number;
  updated: number;
  skipped: number;
  tokensUsed?: number;
}

/**
 * Generate documentation from a CodeMap
 */
export async function generateDocs(
  codeMap: CodeMap,
  config: KodexConfig,
  existingKb: KnowledgeBase,
  options: GenerateOptions = {}
): Promise<GenerateResult> {
  const items: KnowledgeItem[] = [...existingKb.items];
  let generated = 0;
  let updated = 0;
  let skipped = 0;
  let totalTokens = 0;

  // Get the LLM client
  const model = createModel(config);

  // Build a map of existing items by topic
  const existingByTopic = new Map<string, KnowledgeItem>();
  for (const item of existingKb.items) {
    existingByTopic.set(item.topic, item);
  }

  // Get topics to generate based on detected features
  const topicsToGenerate = getTopicsFromFeatures(
    codeMap.features,
    config.docs.topics
  );

  // Generate docs for each topic
  for (const topic of topicsToGenerate) {
    const existing = existingByTopic.get(topic.id);

    // Skip pinned items
    if (existing?.pinned) {
      skipped++;
      continue;
    }

    // Skip unchanged items if changedOnly
    if (options.changedOnly && existing) {
      // Check if source files changed
      const sourceFiles = topic.evidence.map(e => e.sourceFile);
      const existingFiles = new Set(existing.sourceFiles);
      const hasChanges = sourceFiles.some(f => !existingFiles.has(f));
      
      if (!hasChanges) {
        skipped++;
        continue;
      }
    }

    // Build context for generation
    const context = buildContext(topic, codeMap);

    // Generate the doc
    if (!options.dryRun) {
      try {
        const result = await generateDoc(model, topic, context, config.name);
        
        const item: KnowledgeItem = {
          id: existing?.id || `kb-${topic.id.replace(/\./g, '-')}-${Date.now()}`,
          topic: topic.id,
          title: result.title,
          pages: result.pages,
          content: result.content,
          sourceFiles: topic.evidence.map(e => e.sourceFile),
          codeVersion: codeMap.meta.scannedAt, // Should be git commit
          generatedAt: new Date().toISOString(),
          status: 'draft',
          confidence: topic.confidence,
          humanEdited: existing?.humanEdited || false,
          pinned: false,
        };

        // Update or add
        if (existing) {
          const index = items.findIndex(i => i.id === existing.id);
          if (index !== -1) {
            items[index] = item;
            updated++;
          }
        } else {
          items.push(item);
          generated++;
        }

        // Track tokens (rough estimate)
        totalTokens += (context.length + result.content.length) / 4;

      } catch (error) {
        console.error(`Failed to generate doc for ${topic.id}:`, error);
        skipped++;
      }
    } else {
      // Dry run - just count
      if (existing) {
        updated++;
      } else {
        generated++;
      }
    }
  }

  return {
    items,
    generated,
    updated,
    skipped,
    tokensUsed: totalTokens,
  };
}

/**
 * Create the appropriate LLM model
 */
function createModel(config: KodexConfig) {
  const apiKey = getApiKey(config);

  switch (config.llm.provider) {
    case 'anthropic':
      return createAnthropic({ apiKey })(config.llm.model);
    case 'openai':
      return createOpenAI({ apiKey })(config.llm.model);
    case 'google':
      return createGoogleGenerativeAI({ apiKey })(config.llm.model);
    default:
      throw new Error(`Unknown LLM provider: ${config.llm.provider}`);
  }
}

/**
 * Get topics to generate based on detected features
 */
function getTopicsFromFeatures(
  features: DetectedFeature[],
  configTopics: string[]
): DetectedFeature[] {
  // Filter features by configured topics
  const topicPrefixes = new Set(configTopics);
  
  return features.filter(f => {
    const category = f.id.split('.')[0];
    return topicPrefixes.has(category);
  });
}

/**
 * Build context for doc generation
 */
function buildContext(
  feature: DetectedFeature,
  codeMap: CodeMap
): string {
  const parts: string[] = [];

  // Add feature info
  parts.push(`Feature: ${feature.id}`);
  parts.push(`Confidence: ${feature.confidence}`);
  parts.push('');

  // Add relevant pages
  const relevantPages = codeMap.pages.filter(page =>
    feature.evidence.some(e => page.sourceFiles.includes(e.sourceFile))
  );

  if (relevantPages.length > 0) {
    parts.push('Relevant Pages:');
    for (const page of relevantPages) {
      parts.push(`  - ${page.path}`);
      
      // Add strings from this page
      const strings = page.strings.slice(0, 10);
      if (strings.length > 0) {
        parts.push('    UI Elements:');
        for (const s of strings) {
          parts.push(`      - [${s.type}] "${s.value}"`);
        }
      }
    }
    parts.push('');
  }

  // Add evidence snippets
  parts.push('Code Evidence:');
  for (const evidence of feature.evidence.slice(0, 5)) {
    parts.push(`  - ${evidence.pattern} (${evidence.sourceFile}:${evidence.line})`);
  }

  return parts.join('\n');
}

/**
 * Generate a single doc using the LLM
 */
async function generateDoc(
  model: any,
  feature: DetectedFeature,
  context: string,
  productName: string
): Promise<{ title: string; pages: string[]; content: string }> {
  const topicName = feature.id.split('.').pop()?.replace(/-/g, ' ') || feature.id;
  
  const prompt = `You are generating user support documentation for "${productName}".

Context from the codebase:
${context}

Generate a help article for: "${topicName}"

Requirements:
- Write for end users (not developers)
- Be concise and actionable
- Include step-by-step instructions where appropriate
- Reference actual UI elements mentioned in the context
- Use markdown formatting
- Keep it under 500 words

Respond in this exact JSON format:
{
  "title": "Article title (short, clear)",
  "pages": ["list", "of", "relevant", "page", "paths"],
  "content": "Full markdown content of the article"
}`;

  const result = await generateText({
    model,
    prompt,
    maxTokens: 1000,
  });

  // Parse the JSON response
  try {
    const json = JSON.parse(result.text);
    return {
      title: json.title || topicName,
      pages: json.pages || [],
      content: json.content || result.text,
    };
  } catch {
    // If JSON parsing fails, use the raw text
    return {
      title: topicName,
      pages: [],
      content: result.text,
    };
  }
}
