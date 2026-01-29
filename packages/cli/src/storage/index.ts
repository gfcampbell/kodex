/**
 * Knowledge Base Storage
 * 
 * Manages reading and writing the knowledge base files.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import type { KnowledgeBase, KnowledgeItem, GapItem } from '@kodex/shared';
import { loadConfig } from '../config.js';

/**
 * Load the knowledge base from disk
 */
export async function loadKnowledgeBase(rootDir: string): Promise<KnowledgeBase> {
  const kodexDir = join(rootDir, '.kodex');
  const itemsPath = join(kodexDir, 'items.json');
  const gapsPath = join(kodexDir, 'gaps.json');
  const codemapPath = join(kodexDir, 'codemap.json');

  let items: KnowledgeItem[] = [];
  let gaps: GapItem[] = [];
  let codeMap = undefined;

  // Load items
  if (existsSync(itemsPath)) {
    try {
      const data = JSON.parse(readFileSync(itemsPath, 'utf-8'));
      items = data.items || [];
    } catch {
      // Ignore parse errors
    }
  }

  // Load gaps
  if (existsSync(gapsPath)) {
    try {
      const data = JSON.parse(readFileSync(gapsPath, 'utf-8'));
      gaps = data.gaps || [];
    } catch {
      // Ignore parse errors
    }
  }

  // Load codemap
  if (existsSync(codemapPath)) {
    try {
      codeMap = JSON.parse(readFileSync(codemapPath, 'utf-8'));
    } catch {
      // Ignore parse errors
    }
  }

  const config = await loadConfig(rootDir);

  return {
    items,
    gaps,
    codeMap,
    meta: {
      name: config.name,
      version: config.version,
    },
  };
}

/**
 * Save the knowledge base to disk
 */
export async function saveKnowledgeBase(
  rootDir: string,
  kb: KnowledgeBase
): Promise<void> {
  const config = await loadConfig(rootDir);
  const kodexDir = join(rootDir, '.kodex');
  const docsDir = join(rootDir, config.docs.outputDir);

  // Ensure directories exist
  mkdirSync(kodexDir, { recursive: true });
  mkdirSync(docsDir, { recursive: true });

  // Save items.json
  const itemsPath = join(kodexDir, 'items.json');
  writeFileSync(
    itemsPath,
    JSON.stringify({ items: kb.items, meta: kb.meta }, null, 2)
  );

  // Save gaps.json
  const gapsPath = join(kodexDir, 'gaps.json');
  writeFileSync(
    gapsPath,
    JSON.stringify({ gaps: kb.gaps }, null, 2)
  );

  // Save codemap.json
  if (kb.codeMap) {
    const codemapPath = join(kodexDir, 'codemap.json');
    writeFileSync(
      codemapPath,
      JSON.stringify(kb.codeMap, null, 2)
    );
  }

  // Save individual markdown files
  if (config.docs.format === 'markdown' || config.docs.format === 'both') {
    for (const item of kb.items) {
      const mdPath = getMarkdownPath(docsDir, item);
      mkdirSync(dirname(mdPath), { recursive: true });
      writeFileSync(mdPath, generateMarkdown(item));
    }
  }

  // Save JSON files
  if (config.docs.format === 'json' || config.docs.format === 'both') {
    const jsonDir = join(docsDir, 'json');
    mkdirSync(jsonDir, { recursive: true });
    
    for (const item of kb.items) {
      const jsonPath = join(jsonDir, `${item.id}.json`);
      writeFileSync(jsonPath, JSON.stringify(item, null, 2));
    }
  }
}

/**
 * Get the markdown file path for a knowledge item
 */
function getMarkdownPath(docsDir: string, item: KnowledgeItem): string {
  const [category, name] = item.topic.split('.');
  const filename = name ? `${name}.md` : `${category}.md`;
  return join(docsDir, category, filename);
}

/**
 * Generate markdown content for a knowledge item
 */
function generateMarkdown(item: KnowledgeItem): string {
  const frontmatter = [
    '---',
    `id: ${item.id}`,
    `topic: ${item.topic}`,
    `title: "${item.title}"`,
    `pages: [${item.pages.map(p => `"${p}"`).join(', ')}]`,
    `generated: ${item.generatedAt}`,
    `status: ${item.status}`,
    `confidence: ${item.confidence}`,
    item.humanEdited ? 'humanEdited: true' : null,
    item.pinned ? 'pinned: true' : null,
    '---',
    '',
  ].filter(Boolean).join('\n');

  return frontmatter + item.content;
}

/**
 * Add a gap to the knowledge base
 */
export async function addGap(
  rootDir: string,
  question: string,
  page?: string
): Promise<GapItem> {
  const kb = await loadKnowledgeBase(rootDir);

  // Check for duplicate (fuzzy match)
  const existing = kb.gaps.find(g => 
    g.question.toLowerCase() === question.toLowerCase()
  );

  if (existing) {
    existing.frequency++;
    await saveKnowledgeBase(rootDir, kb);
    return existing;
  }

  // Create new gap
  const gap: GapItem = {
    id: `gap-${Date.now()}`,
    question,
    page,
    askedAt: new Date().toISOString(),
    frequency: 1,
    status: 'pending',
  };

  kb.gaps.push(gap);
  await saveKnowledgeBase(rootDir, kb);
  return gap;
}

/**
 * Resolve a gap
 */
export async function resolveGap(
  rootDir: string,
  gapId: string,
  resolvedBy?: string,
  resolution?: string
): Promise<void> {
  const kb = await loadKnowledgeBase(rootDir);
  
  const gap = kb.gaps.find(g => g.id === gapId);
  if (!gap) {
    throw new Error(`Gap not found: ${gapId}`);
  }

  gap.status = 'resolved';
  gap.resolvedBy = resolvedBy;
  gap.resolution = resolution;

  await saveKnowledgeBase(rootDir, kb);
}
