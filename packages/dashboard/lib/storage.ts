import { promises as fs } from "fs";
import path from "path";
import type { KnowledgeBase, KnowledgeItem, GapItem } from "@kodex/shared";

const ITEMS_FILE = "items.json";
const GAPS_FILE = "gaps.json";

/**
 * Get the .kodex directory path for a project
 */
function getKodexDir(projectPath: string): string {
  return path.join(projectPath, ".kodex");
}

/**
 * Ensure the .kodex directory exists
 */
async function ensureKodexDir(projectPath: string): Promise<void> {
  const kodexDir = getKodexDir(projectPath);
  await fs.mkdir(kodexDir, { recursive: true });
  await fs.mkdir(path.join(kodexDir, "docs"), { recursive: true });
}

/**
 * Load the knowledge base from a project
 */
export async function loadKnowledgeBase(projectPath: string): Promise<KnowledgeBase> {
  const kodexDir = getKodexDir(projectPath);
  
  let items: KnowledgeItem[] = [];
  let gaps: GapItem[] = [];

  // Load items
  try {
    const itemsPath = path.join(kodexDir, ITEMS_FILE);
    const content = await fs.readFile(itemsPath, "utf-8");
    const data = JSON.parse(content);
    items = data.items || [];
  } catch {
    // No items file yet
  }

  // Load gaps
  try {
    const gapsPath = path.join(kodexDir, GAPS_FILE);
    const content = await fs.readFile(gapsPath, "utf-8");
    const data = JSON.parse(content);
    gaps = data.gaps || [];
  } catch {
    // No gaps file yet
  }

  return {
    items,
    gaps,
    meta: {
      name: "Knowledge Base",
      version: "1.0.0",
    },
  };
}

/**
 * Save the knowledge base to a project
 */
export async function saveKnowledgeBase(
  projectPath: string,
  kb: KnowledgeBase
): Promise<void> {
  await ensureKodexDir(projectPath);
  const kodexDir = getKodexDir(projectPath);

  // Save items
  const itemsPath = path.join(kodexDir, ITEMS_FILE);
  await fs.writeFile(
    itemsPath,
    JSON.stringify({ items: kb.items, meta: kb.meta }, null, 2),
    "utf-8"
  );

  // Save gaps
  const gapsPath = path.join(kodexDir, GAPS_FILE);
  await fs.writeFile(
    gapsPath,
    JSON.stringify({ gaps: kb.gaps }, null, 2),
    "utf-8"
  );
}

/**
 * Get a single knowledge item by ID
 */
export async function getKnowledgeItem(
  projectPath: string,
  itemId: string
): Promise<KnowledgeItem | null> {
  const kb = await loadKnowledgeBase(projectPath);
  return kb.items.find((item) => item.id === itemId) || null;
}

/**
 * Update a single knowledge item
 */
export async function updateKnowledgeItem(
  projectPath: string,
  itemId: string,
  updates: Partial<KnowledgeItem>
): Promise<KnowledgeItem | null> {
  const kb = await loadKnowledgeBase(projectPath);
  const index = kb.items.findIndex((item) => item.id === itemId);
  
  if (index === -1) {
    return null;
  }

  // Merge updates
  kb.items[index] = {
    ...kb.items[index],
    ...updates,
    lastEditedAt: new Date().toISOString(),
  };

  await saveKnowledgeBase(projectPath, kb);
  return kb.items[index];
}

/**
 * Delete a knowledge item
 */
export async function deleteKnowledgeItem(
  projectPath: string,
  itemId: string
): Promise<boolean> {
  const kb = await loadKnowledgeBase(projectPath);
  const index = kb.items.findIndex((item) => item.id === itemId);
  
  if (index === -1) {
    return false;
  }

  kb.items.splice(index, 1);
  await saveKnowledgeBase(projectPath, kb);
  return true;
}

/**
 * Save a markdown doc file
 */
export async function saveDocMarkdown(
  projectPath: string,
  item: KnowledgeItem
): Promise<void> {
  await ensureKodexDir(projectPath);
  const docsDir = path.join(getKodexDir(projectPath), "docs");

  // Create topic subdirectory
  const topicDir = item.topic.split(".")[0];
  const topicPath = path.join(docsDir, topicDir);
  await fs.mkdir(topicPath, { recursive: true });

  // Write markdown file
  const fileName = `${item.id}.md`;
  const filePath = path.join(topicPath, fileName);
  
  const frontmatter = `---
id: ${item.id}
title: ${item.title}
topic: ${item.topic}
pages: ${JSON.stringify(item.pages)}
status: ${item.status}
---

`;

  await fs.writeFile(filePath, frontmatter + item.content, "utf-8");
}
